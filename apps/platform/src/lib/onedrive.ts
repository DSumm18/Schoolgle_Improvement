export const loadOneDriveApi = (callback: () => void) => {
    const script = document.createElement("script");
    script.src = "https://js.live.net/v7.2/OneDrive.js";
    script.id = "onedrive-js";
    script.onload = () => {
        callback();
    };
    if (document.getElementById("onedrive-js")) {
        callback();
    } else {
        document.body.appendChild(script);
    }
};
