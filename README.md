# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Applying Firestore & Storage Security Rules

This project includes `firestore.rules` and `storage.rules` files with recommended security settings for a single-admin application.

### Firestore Rules

1.  Open the **Firebase Console** for your project.
2.  Go to **Build > Firestore Database**.
3.  Click on the **"Rules"** tab.
4.  Copy the entire content of the `firestore.rules` file from your project.
5.  Paste it into the editor in the Firebase Console, completely replacing the existing rules.
6.  Click **"Publish"**.

### Storage Rules

1.  In the **Firebase Console**, go to **Build > Storage**.
2.  Click on the **"Rules"** tab.
3.  Copy the entire content of the `storage.rules` file from your project.
4.  Paste it into the editor, replacing the existing rules.
5.  Click **"Publish"**.

## Fixing File Upload Errors (CORS Policy)

If you are seeing a `storage/unknown` error in the console when trying to upload images (like a school logo), you need to update the CORS policy for your Firebase Storage bucket.

1.  **Install `gcloud`**: If you don't have it, [install the Google Cloud CLI](https://cloud.google.com/sdk/docs/install).

2.  **Create a CORS configuration file**: Create a new file on your local computer named `cors.json` and paste the following content into it:

    ```json
    [
      {
        "origin": ["*"],
        "method": ["GET", "POST", "PUT", "HEAD"],
        "maxAgeSeconds": 3600
      }
    ]
    ```

3.  **Apply the configuration**: Run the following command in your terminal, replacing `[YOUR_BUCKET_URL]` with your actual Firebase Storage bucket URL (e.g., `gs://my-project.appspot.com`):

    ```bash
    gcloud storage buckets update [YOUR_BUCKET_URL] --cors-file=cors.json
    ```

    You can find your bucket URL at the top of the **Build > Storage > Files** page in your Firebase Console. After running this command, your file uploads should work correctly.