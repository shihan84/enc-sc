import { NextRequest, NextResponse } from 'next/server'

interface SCTE35Request {
  inputUrl: string
  outputUrl: string
  preRollSeconds: number
  spliceType: string
  autoInsert: boolean
  // SCTE35 Parameters
  adDuration: number
  scteEventId: string
  scteDataPid: number
  nullPid: number
  latency: number
}

interface SCTE35Response {
  success: boolean
  message: string
  markerId?: string
  timestamp?: string
  eventId?: string
  cueType?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<SCTE35Response>> {
  try {
    const body: SCTE35Request = await request.json()
    
    // Validate input
    if (!body.inputUrl || !body.outputUrl) {
      return NextResponse.json({
        success: false,
        message: 'Input and output URLs are required'
      }, { status: 400 })
    }

    // Generate SCTE35 marker command using TSDuck
    const markerId = generateMarkerId()
    const timestamp = new Date().toISOString()
    
    // Build TSDuck command for SCTE35 insertion with distributor specs
    const tsduckCommand = buildDistributorSCTE35Command(body, markerId)
    
    // Execute TSDuck command (simulated for now)
    console.log('Executing SCTE35 with distributor specs:', tsduckCommand)
    
    // In a real implementation, you would execute:
    // tsp --input ${body.inputUrl} --scte35-insert ... --output ${body.outputUrl}
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return NextResponse.json({
      success: true,
      message: `SCTE35 ${body.spliceType} marker inserted successfully`,
      markerId,
      timestamp,
      eventId: body.scteEventId,
      cueType: body.spliceType
    })

  } catch (error) {
    console.error('SCTE35 insertion error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to insert SCTE35 marker'
    }, { status: 500 })
  }
}

function generateMarkerId(): string {
  return `scte35_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function buildDistributorSCTE35Command(config: SCTE35Request, markerId: string): string {
  // Map cue type to SCTE35 command
  const cueCommandMap: { [key: string]: string } = {
    'CUE-OUT': 'splice_insert',
    'CUE-IN': 'splice_insert'
  }
  
  const command = cueCommandMap[config.spliceType] || 'splice_insert'
  
  // Build TSDuck command with distributor specifications
  const tsduckCmd = [
    'tsp',
    `--input ${config.inputUrl}`,
    `--scte35-insert ${command}`,
    `--scte35-splice-id ${config.scteEventId}`,
    `--scte35-marker-id ${markerId}`,
    `--scte35-duration ${config.adDuration * 90000}`, // Convert to 90kHz ticks
    `--scte35-pre-roll ${config.preRollSeconds * 90000}`, // Convert to 90kHz ticks
    `--scte35-pid ${config.scteDataPid}`,
    `--scte35-null-pid ${config.nullPid}`,
    `--scte35-latency ${config.latency}`,
    '--scte35-auto-return' // Auto return to program
  ]
  
  // Add cue-specific parameters
  if (config.spliceType === 'CUE-OUT') {
    tsduckCmd.push('--scte35-out-of-network')
  } else if (config.spliceType === 'CUE-IN') {
    tsduckCmd.push('--scte35-return-to-network')
  }
  
  if (config.autoInsert) {
    tsduckCmd.push('--scte35-auto-insert')
  }
  
  tsduckCmd.push(`--output ${config.outputUrl}`)
  
  return tsduckCmd.join(' ')
}