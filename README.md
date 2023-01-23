# Drive Uploader via Google API

### Why use this app?
when we work for user can upload files to drive but user can not delete the files in the production drive. We may be know that there have no scope this allow upload files and also can not delete the files. This app will use as middleware for upload the drive. First upload the drive in this app. Then make owner to production drive email and revoke permission for this app. 

### It return oauth2 token for upload to drive then you can make owener to you and rovoke permission the app drive.
```
https://script.google.com/macros/s/AKfycbwPI6VOmohjeGN2nkLIV5MG-9LW0HIAa_FflKwcIvecKL41lAfd5ueOEUwnMC3w6Uwojw/exec
```

### Example
```
const start = async () => {
  await gapi.client.init({
    discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
  });

  gapi.client.setToken({
    access_token: "", // oauth2 token or when you init gapi clint then automatically get the token
  });

  // extend upload big file with gapi drive files api. which is a class!
  gapi.client.drive.files.upload = class {
    constructor(options) {
      this.file = options.file;
      this.token = gapi.client.getToken().access_token;
      this.metadata = options.metadata;
      this.onError = options.onError;
      this.onComplete = options.onComplete;
      this.onProgress = options.onProgress;

      this.xhr = new XMLHttpRequest();
      this.xhr.open("POST", this.url, true);
      this.xhr.setRequestHeader("Authorization", "Bearer " + this.token);
      this.xhr.setRequestHeader("Content-Type", "application/json");
      this.xhr.setRequestHeader("X-Upload-Content-Type", this.file.type);
      this.xhr.setRequestHeader("X-Upload-Content-Length", this.file.size);
      this.xhr.onload = this.onXhrLoad.bind(this);
      this.xhr.onerror = this.onXhrError.bind(this);
      // this.xhr.upload.onprogress = this.onXhrProgress.bind(this);
      this.xhr.send(JSON.stringify(this.metadata));
    }

    onXhrLoad() {
      if (this.xhr.status === 200) {
        this.url = this.xhr.getResponseHeader("Location");
        this.sendFile();
      } else {
        this?.onError(JSON.parse(this.xhr.response));
      }
    }

    onXhrError() {
      this?.onError(this.xhr.response);
    }

    onXhrProgress(event) {
      this?.onProgress(event);
    }

    sendFile() {
      let xhr = new XMLHttpRequest();
      xhr.open("PUT", this.url, true);
      xhr.setRequestHeader("Content-Type", this.file.type);
      xhr.onload = () => {
        if (xhr.status === 200) {
          this?.onComplete(JSON.parse(xhr.response));
        } else {
          this?.onError(JSON.parse(xhr.response));
        }
      };
      xhr.onerror = this.onError.bind(this);
      xhr.upload.onprogress = this.onProgress.bind(this);
      xhr.send(this.file);
    }
  };
};


new gapi.client.drive.files.upload({
  file: file,
  metadata: fileMetadata,
  onError: function(response) {
    console.error(response);
  },
  onComplete: function(response) {
    console.log(response)
    console.log(`File ID: ${response.id}`);

    gapi.client.drive.permissions.create({
        fileId: response.id,
        transferOwnership: true,
        resource: {
            role: 'owner',
            type: 'user',
            emailAddress: 'NEW_OWNER_EMAIL'
        }
    }).then(() => {
        gapi.client.drive.permissions.delete({
            fileId: response.id,
            permissionId: 'ME'
        });
    });
  },
  onProgress: function(event) {
    console.log(`Upload progress: ${event.loaded} of ${event.total}`);
  }
});

gapi.load("client", start);
```