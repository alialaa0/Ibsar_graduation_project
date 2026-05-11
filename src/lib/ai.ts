/// <reference types="vite/client" />

export async function analyzeRetinalImage(base64Image: string, patientName?: string, patientId?: string) {
  // Use the environment variable, falling back to the known HuggingFace URL if not set
  const baseUrl = import.meta.env.VITE_FASTAPI_URL || "https://3li3laaa-ibsar.hf.space";
  
  // Construct the absolute endpoint URL, ensuring it ends with /predict
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  const apiUrl = cleanBaseUrl.endsWith("/predict") ? cleanBaseUrl : `${cleanBaseUrl}/predict`;
  
  console.log("Analyzing image via custom FastAPI at:", apiUrl);

  try {
    // 1. Convert base64 data URL to a File object
    const responseArr = base64Image.split(',');
    const mimeMatch = responseArr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(responseArr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], {type: mime});
    const file = new File([blob], "retinal_scan.jpg", { type: mime });

    // 2. Prepare FormData exactly as requested
    const formData = new FormData();
    formData.append("file", file);
    if (patientName) formData.append("patient_name", patientName);
    if (patientId) formData.append("patient_id", patientId);

    // 3. Execute POST request
    const response = await fetch(apiUrl, {
      method: "POST",
      body: formData,
      // Note: Browser sets Content-Type automatically for FormData
    });

    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      if (response.status === 405) {
        errorMessage += " (Method Not Allowed. This endpoint expects POST. Ensure your FastAPI code uses @app.post('/predict'))";
      }
      try {
        const errorData = await response.json();
        errorMessage += ` - ${JSON.stringify(errorData)}`;
      } catch { /* Not JSON */ }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Analysis Success:", data);
    return data;
  } catch (error) {
    console.error("FastAPI Backend Analysis error:", error);
    throw error;
  }
}
