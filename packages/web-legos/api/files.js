export async function openFileBrowser() {
  return new Promise((resolve, reject) => {
    let input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png, image/jpeg, , image/jpg, image/heic";
    input.multiple = false;
    input.onchange = _ => {
      resolve(input.files[0]);
    }
    input.click();
  })
}

export function getFileExtension(file) {
  if (!file) { return "" ; }
  if (!file.name) { return ""; }
  return file.name.split('.').pop();
}

export function getFileNameByCurrentTime(file) {
  return `${Date.now().toString()}.${getFileExtension(file)}`;
}
