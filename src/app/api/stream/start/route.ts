import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface StreamStartRequest {
  streamName: string
  inputUrl: string
  outputUrl: string
  // Service Configuration
  serviceName: string
  provider: string
  serviceId: number
  // Video Specifications
  videoResolution: string
  videoCodec: string
  videoBitrate: number
  gop: number
  bFrames: number
  profileLevel: string
  chroma: string
  aspectRatio: string
  pcr: string
  // Audio Specifications
  audioCodec: string
  audioBitrate: number
  audioLkfs: number
  audioSamplingRate: number
  // PID Configuration
  scteDataPid: number
  nullPid: number
  latency: number
}

interface StreamStartResponse {
  success: boolean
  message: string
  streamId?: string
  pid?: number
  command?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<StreamStartResponse>> {
  try {
    const body: StreamStartRequest = await request.json()
    
    // Validate input
    if (!body.inputUrl || !body.outputUrl) {
      return NextResponse.json({
        success: false,
        message: 'Input and output URLs are required'
      }, { status: 400 })
    }

    // Generate stream ID
    const streamId = `${body.serviceName}_${Date.now()}`
    
    // Build real TSDuck command based on your specification
    const tsduckCommand = buildRealTSDuckCommand(body, streamId)
    
    console.log('Starting stream with real TSDuck command:', tsduckCommand)
    
    try {
      // Execute TSDuck command
      const { stdout, stderr } = await execAsync(tsduckCommand)
      
      console.log('TSDuck stdout:', stdout)
      if (stderr) {
        console.log('TSDuck stderr:', stderr)
      }
      
      return NextResponse.json({
        success: true,
        message: 'Stream started successfully with TSDuck',
        streamId,
        command: tsduckCommand
      })
      
    } catch (execError: any) {
      console.error('TSDuck execution error:', execError)
      
      // Check if TSDuck is not installed
      if (execError.code === 127) {
        return NextResponse.json({
          success: false,
          message: 'TSDuck is not installed. Please install TSDuck to use real streaming functionality.'
        }, { status: 500 })
      }
      
      return NextResponse.json({
        success: false,
        message: `TSDuck execution failed: ${execError.message}`,
        command: tsduckCommand
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Stream start error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to start stream'
    }, { status: 500 })
  }
}

function buildRealTSDuckCommand(config: StreamStartRequest, streamId: string): string {
  // Parse input URL to determine input type
  const isHLS = config.inputUrl.includes('.m3u8')
  const inputType = isHLS ? 'hls' : 'srt'
  
  // Parse output URL for SRT configuration
  const outputMatch = config.outputUrl.match(/srt:\/\/([^:]+):(\d+)/)
  const outputHost = outputMatch ? outputMatch[1] : 'cdn.itassist.one'
  const outputPort = outputMatch ? outputMatch[2] : '8888'
  
  const tsduckCmd = [
    'tsp',
    `-I ${inputType} ${config.inputUrl}`,
    // Service Descriptor Table
    '-P sdt',
    `--service ${config.serviceId}`,
    `--name "${config.serviceName}"`,
    `--provider "${config.provider}"`,
    // PID remapping (as per your command)
    '-P remap 211=256 221=257',
    // PMT configuration
    '-P pmt',
    `--service ${config.serviceId}`,
    '--add-pid 256/0x1b', // H.264 video
    '--add-pid 257/0x0f', // AAC audio
    `--add-pid ${config.scteDataPid}/0x86`, // SCTE35
    // Output configuration
    '-O srt',
    `--caller ${outputHost}:${outputPort}`,
    `--latency ${config.latency}`,
    `--streamid #!::r=scte/scte,m=publish`
  ]
  
  return tsduckCmd.join(' ')
}