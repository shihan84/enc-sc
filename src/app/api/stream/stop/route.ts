import { NextRequest, NextResponse } from 'next/server'

interface StreamStopRequest {
  streamId: string
  pid: number
}

interface StreamStopResponse {
  success: boolean
  message: string
}

export async function POST(request: NextRequest): Promise<NextResponse<StreamStopResponse>> {
  try {
    const body: StreamStopRequest = await request.json()
    
    // Validate input
    if (!body.streamId || !body.pid) {
      return NextResponse.json({
        success: false,
        message: 'Stream ID and PID are required'
      }, { status: 400 })
    }

    // Build TSDuck command to stop stream
    const tsduckCommand = `tsp --stop --pid ${body.pid}`
    
    // Execute TSDuck command (simulated for now)
    console.log('Stopping stream with command:', tsduckCommand)
    
    // In a real implementation, you would execute:
    // tsp --stop --pid ${body.pid}
    
    // Simulate stream shutdown
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return NextResponse.json({
      success: true,
      message: 'Stream stopped successfully'
    })

  } catch (error) {
    console.error('Stream stop error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to stop stream'
    }, { status: 500 })
  }
}