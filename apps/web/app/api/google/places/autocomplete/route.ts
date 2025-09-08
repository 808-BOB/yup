import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();
    
    console.log('API Key available:', !!process.env.GOOGLE_MAPS_API_KEY);
    console.log('Input received:', input);

    if (!input || input.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key not found in environment variables');
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      );
    }

    // Use the new Places API for autocomplete
    const requestBody = {
      input,
      locationBias: {
        circle: {
          center: {
            latitude: 41.8781,
            longitude: -87.6298
          },
          radius: 50000
        }
      }
    };

    console.log('Making request to Google Places API with body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Places API error:', response.status, errorText);
      throw new Error(`Google Places API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Google Places API response:', data);
    
    // Transform the new API response to our format
    const suggestions = data.suggestions?.map((suggestion: any) => ({
      placeId: suggestion.placePrediction?.placeId || suggestion.placePrediction?.place?.replace('places/', ''),
      text: suggestion.placePrediction?.text?.text || '',
      mainText: suggestion.placePrediction?.structuredFormat?.mainText?.text || '',
      secondaryText: suggestion.placePrediction?.structuredFormat?.secondaryText?.text || '',
      types: suggestion.placePrediction?.types || []
    })) || [];

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('Places autocomplete error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch place suggestions' },
      { status: 500 }
    );
  }
}
