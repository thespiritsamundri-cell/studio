'use server';

interface GenerateBarcodeRequest {
  content: string;
}

interface GenerateBarcodeResponse {
  barcodeDataUri: string;
}

export async function generateBarcode(input: GenerateBarcodeRequest): Promise<GenerateBarcodeResponse> {
    // Using barcode.tec-it.com to generate a QR Code image.
    const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(
      input.content
    )}&code=QRCode&dpi=96`;
    
    const response = await fetch(barcodeUrl);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return {
      barcodeDataUri: `data:image/png;base64,${base64}`,
    };
}
