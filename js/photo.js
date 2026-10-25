// Shrinks a photo to at most 800 pixels wide (about 100 KB), cropped to 3:4 from the center.
export function shrinkPhoto(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = Math.min(800, img.width);
      const h = Math.round((w * 4) / 3);
      const scale = Math.max(w / img.width, h / img.height);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const dw = img.width * scale;
      const dh = img.height * scale;
      canvas.getContext('2d').drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => reject(new Error('Not a picture'));
    img.src = URL.createObjectURL(file);
  });
}
