/**
 * Client-side image compressor using HTML5 Canvas.
 * Compresses an image file to be under the specified target size (in KB).
 * 
 * @param {File} file - The file object from input type="file"
 * @param {number} targetSizeKb - Target maximum size in KB (default: 200)
 * @returns {Promise<string>} - A Promise that resolves to the compressed image data URL
 */
export const compressImage = (file, targetSizeKb = 200) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("No file provided"));
    }

    // If file is already smaller than or equal to target size, read it directly
    if (file.size <= targetSizeKb * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    // Otherwise, perform canvas-based compression
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Set a maximum boundary dimension to avoid excessively large images
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        const isTransparent = file.type === "image/png" || file.type === "image/webp" || file.type === "image/svg+xml";
        const mimeType = isTransparent ? "image/webp" : "image/jpeg";

        if (mimeType === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Step 1: Adjust quality (starting from 0.92 down to 0.2)
        let quality = 0.92;
        let dataUrl = canvas.toDataURL(mimeType, quality);

        // If WebP is not supported or falls back, check size
        while (dataUrl.length * (3 / 4) > targetSizeKb * 1024 && quality > 0.2) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL(mimeType, quality);
        }

        // Step 2: If size is still too large, dynamically scale down dimensions
        if (dataUrl.length * (3 / 4) > targetSizeKb * 1024) {
          let scale = 0.8;
          while (dataUrl.length * (3 / 4) > targetSizeKb * 1024 && scale > 0.2) {
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = Math.round(width * scale);
            tempCanvas.height = Math.round(height * scale);
            const tempCtx = tempCanvas.getContext("2d");
            if (mimeType === "image/jpeg") {
              tempCtx.fillStyle = "#ffffff";
              tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            }
            tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
            dataUrl = tempCanvas.toDataURL(mimeType, 0.7);
            scale -= 0.2;
          }
        }

        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

