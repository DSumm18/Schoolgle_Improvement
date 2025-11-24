export const loadGoogleDriveApi = (callback: () => void) => {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => {
        window.gapi.load("picker", { callback });
    };
    document.body.appendChild(script);
};
