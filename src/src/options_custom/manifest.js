// SAMPLE
this.manifest = {
    "name": i18n.get("appname"),
    "icon": "icon.png",
    "settings": [
        {
            "tab": i18n.get("basic"),
            "group": i18n.get("ban"),
            "name": "users",
            "type": "textarea",
            "label": i18n.get("username"),
            "text": i18n.get("users-to-banned")
        },
        {
            "tab": i18n.get("basic"),
            "group": i18n.get("ban"),
            "name": "msgs",
            "type": "textarea",
            "label": i18n.get("keywords"),
            "text": i18n.get("keywords-to-banned")
        }
    ]
};
