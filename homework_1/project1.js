// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite(bgImg, fgImg, fgOpac, fgPos) {
    const bgCanvas = document.createElement('canvas');
    const bgCtx = bgCanvas.getContext('2d');
    bgCanvas.width = bgImg.width;
    bgCanvas.height = bgImg.height;
    bgCtx.putImageData(bgImg, 0, 0);
    const bgData = bgCtx.getImageData(0, 0, bgImg.width, bgImg.height).data;
  
    const fgCanvas = document.createElement('canvas');
    const fgCtx = fgCanvas.getContext('2d');
    fgCanvas.width = fgImg.width;
    fgCanvas.height = fgImg.height;
    fgCtx.putImageData(fgImg, 0, 0);
    const fgData = fgCtx.getImageData(0, 0, fgImg.width, fgImg.height).data;
  
    const xOffset = fgPos.x;
    const yOffset = fgPos.y;
  
    for (let y = 0; y < fgImg.height; y++) {
      for (let x = 0; x < fgImg.width; x++) {
        const bgX = x + xOffset;
        const bgY = y + yOffset;
  
        if (bgX >= 0 && bgX < bgImg.width && bgY >= 0 && bgY < bgImg.height) {
          const fgIndex = (y * fgImg.width + x) * 4;
          const bgIndex = (bgY * bgImg.width + bgX) * 4;
  
          const fgR = fgData[fgIndex];
          const fgG = fgData[fgIndex + 1];
          const fgB = fgData[fgIndex + 2];
          const fgA = fgData[fgIndex + 3] / 255 * fgOpac;
  
          const bgR = bgData[bgIndex];
          const bgG = bgData[bgIndex + 1];
          const bgB = bgData[bgIndex + 2];
          const bgA = bgData[bgIndex + 3] / 255;
  
          const outA = 1 - (1 - fgA) * (1 - bgA);
          const outR = (fgR * fgA + bgR * bgA * (1 - fgA)) / outA;
          const outG = (fgG * fgA + bgG * bgA * (1 - fgA)) / outA;
          const outB = (fgB * fgA + bgB * bgA * (1 - fgA)) / outA;
  
          bgData[bgIndex] = outR;
          bgData[bgIndex + 1] = outG;
          bgData[bgIndex + 2] = outB;
          bgData[bgIndex + 3] = outA * 255;
        }
      }
    }
  
    bgCtx.putImageData(new ImageData(bgData, bgImg.width, bgImg.height), 0, 0);
    for(let i = 0; i < bgImg.data.length; i++){
      bgImg.data[i] = bgData[i];
    }
  
  }
