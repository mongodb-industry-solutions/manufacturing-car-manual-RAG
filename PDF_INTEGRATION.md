# PDF Integration Instructions

This document explains how to integrate your car manual PDF with the application to enable direct reference to original PDF pages.

## Steps to Integrate Your PDF

1. **Place your PDF in the public directory**

   Copy your car manual PDF file to the frontend's public directory:

   ```bash
   cp "/path/to/your/car-manual.pdf" "/Users/mehar.grewal/Desktop/Work/Coding/Manufacturing/manufacturing-car-manual-RAG/frontend/public/car-manual.pdf"
   ```

   Note: The file should be named `car-manual.pdf` to match the path referenced in the code.

2. **Adjust file path if needed**

   If you need to use a different filename or path, update the `pdfPath` variable in the chunk detail page:

   ```tsx
   // In frontend/app/chunk/[id]/page.tsx
   const pdfPath = '/your-custom-filename.pdf';
   ```

3. **Performance considerations**

   Since your PDF is 12.5 MB, here are some optimization tips:

   - The PDF is loaded only when a user clicks the "View in Original PDF" button
   - Consider compressing the PDF if it contains high-resolution images
   - To improve initial load time, you could host the PDF on a CDN and update the `pdfPath` to point to the CDN URL

4. **PDF.js Worker Configuration**

   We've configured the PDF.js worker to be loaded dynamically when needed. The implementation:
   
   - Uses the `pdf.worker.entry` module that comes with pdfjs-dist
   - Dynamically imports the worker to avoid issues with SSR (Server-Side Rendering)
   - Only renders the PDF viewer once the worker is initialized

   This approach avoids the need to manually copy worker files to the public directory.

5. **Testing the integration**

   After placing the PDF in the public directory:
   - Launch the application with `npm run dev`
   - Navigate to any chunk detail page
   - The "View in Original PDF" button should appear
   - Clicking it will open a modal showing the original PDF at the specific page

## Troubleshooting

- **PDF doesn't load**: Check that the PDF file path is correct and that the file is in the public directory
- **PDF loads but shows blank**: Try a different PDF or check browser console for errors
- **Modal opens but PDF isn't visible**: Check that the page number is valid for your PDF

## Alternative Hosting Options

### S3 Bucket Hosting

If you prefer to host the PDF on AWS S3:

1. Upload your PDF to S3:
   ```bash
   aws s3 cp "/path/to/your/car-manual.pdf" s3://your-bucket-name/car-manual.pdf --acl public-read
   ```

2. Update the `pdfPath` variable to point to the S3 URL:
   ```tsx
   const pdfPath = 'https://your-bucket-name.s3.amazonaws.com/car-manual.pdf';
   ```

### Google Drive Hosting

If you prefer to host on Google Drive:

1. Upload your PDF to Google Drive
2. Make it publicly available via link
3. Get the file ID from the share link
4. Update the `pdfPath` variable:
   ```tsx
   const pdfPath = `https://drive.google.com/uc?export=download&id=YOUR_FILE_ID`;
   ```

Note: Cross-origin restrictions may apply when loading PDFs from external sources. You might need to add CORS headers to your S3 bucket or use a proxy server.