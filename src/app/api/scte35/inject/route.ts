import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const execAsync = promisify(exec)

interface SCTE35InjectRequest {
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
  // Service Configuration
  serviceName: string
  provider: string
  serviceId: number
}

interface SCTE35InjectResponse {
  success: boolean
  message: string
  markerId?: string
  timestamp?: string
  eventId?: string
  cueType?: string
  command?: string
  xmlFile?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<SCTE35InjectResponse>> {
  try {
    const body: SCTE35InjectRequest = await request.json()
    
    // Validate input
    if (!body.inputUrl || !body.outputUrl) {
      return NextResponse.json({
        success: false,
        message: 'Input and output URLs are required'
      }, { status: 400 })
    }

    // Generate marker details
    const markerId = `scte35_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = new Date().toISOString()
    const xmlFileName = `preroll_${body.scteEventId}_${Date.now()}.xml`
    
    // Create SCTE35 XML file
    const xmlFilePath = await createSCTE35XMLFile(xmlFileName, body)
    
    // Build real TSDuck spliceinject command
    const tsduckCommand = buildRealSpliceInjectCommand(body, xmlFilePath)
    
    console.log('Executing SCTE35 spliceinject command:', tsduckCommand)
    
    try {
      // Execute TSDuck spliceinject command
      const { stdout, stderr } = await execAsync(tsduckCommand)
      
      console.log('TSDuck spliceinject stdout:', stdout)
      if (stderr) {
        console.log('TSDuck spliceinject stderr:', stderr)
      }
      
      return NextResponse.json({
        success: true,
        message: `SCTE35 ${body.spliceType} marker injected successfully`,
        markerId,
        timestamp,
        eventId: body.scteEventId,
        cueType: body.spliceType,
        command: tsduckCommand,
        xmlFile: xmlFilePath
      })
      
    } catch (execError: any) {
      console.error('TSDuck spliceinject execution error:', execError)
      
      // Check if TSDuck is not installed
      if (execError.code === 127) {
        return NextResponse.json({
          success: false,
          message: 'TSDuck is not installed. Please install TSDuck to use real SCTE35 injection functionality.'
        }, { status: 500 })
      }
      
      return NextResponse.json({
        success: false,
        message: `TSDuck spliceinject execution failed: ${execError.message}`,
        command: tsduckCommand
      }, { status: 500 })
    }

  } catch (error) {
    console.error('SCTE35 injection error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to inject SCTE35 marker'
    }, { status: 500 })
  }
}

async function createSCTE35XMLFile(fileName: string, config: SCTE35InjectRequest): Promise<string> {
  // Create scte35_final directory if it doesn't exist
  const scteDir = join(process.cwd(), 'scte35_final')
  try {
    mkdirSync(scteDir, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
  
  const filePath = join(scteDir, fileName)
  
  // Generate SCTE35 XML content based on splice type
  const xmlContent = generateSCTE35XML(config)
  
  // Write XML file
  writeFileSync(filePath, xmlContent, 'utf8')
  
  return filePath
}

function generateSCTE35XML(config: SCTE35InjectRequest): string {
  const currentTime = Math.floor(Date.now() / 1000)
  const preRollTicks = config.preRollSeconds * 90000 // Convert to 90kHz ticks
  const durationTicks = config.adDuration * 90000 // Convert to 90kHz ticks
  
  if (config.spliceType === 'CUE-OUT') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<SpliceInfoSection xmlns="urn:scte:scte35:2014:xml+bin"
                    protocolVersion="40"
                    ptsAdjustment="0"
                    tier="4095">
    <SpliceInsert>
        <SpliceEventId>${config.scteEventId}</SpliceEventId>
        <EventCancellationIndicator>0</EventCancellationIndicator>
        <OutOfNetwork>true</OutOfNetwork>
        <ProgramSplice>
            <SpliceTime>
                <PTS>${preRollTicks}</PTS>
            </SpliceTime>
        </ProgramSplice>
        <BreakDuration>
            <Duration>${durationTicks}</Duration>
            <AutoReturn>true</AutoReturn>
        </BreakDuration>
        <UniqueProgramId>1</UniqueProgramId>
        <AvailNum>1</AvailNum>
        <AvailsExpected>1</AvailsExpected>
    </SpliceInsert>
</SpliceInfoSection>`
  } else if (config.spliceType === 'CUE-IN') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<SpliceInfoSection xmlns="urn:scte:scte35:2014:xml+bin"
                    protocolVersion="40"
                    ptsAdjustment="0"
                    tier="4095">
    <SpliceInsert>
        <SpliceEventId>${config.scteEventId}</SpliceEventId>
        <EventCancellationIndicator>0</EventCancellationIndicator>
        <OutOfNetwork>false</OutOfNetwork>
        <ProgramSplice>
            <SpliceTime>
                <PTS>${preRollTicks}</PTS>
            </SpliceTime>
        </ProgramSplice>
        <UniqueProgramId>1</UniqueProgramId>
        <AvailNum>1</AvailNum>
        <AvailsExpected>1</AvailsExpected>
    </SpliceInsert>
</SpliceInfoSection>`
  }
  
  return ''
}

function buildRealSpliceInjectCommand(config: SCTE35InjectRequest, xmlFilePath: string): string {
  // Parse output URL for SRT configuration
  const outputMatch = config.outputUrl.match(/srt:\/\/([^:]+):(\d+)/)
  const outputHost = outputMatch ? outputMatch[1] : 'cdn.itassist.one'
  const outputPort = outputMatch ? outputMatch[2] : '8888'
  
  const tsduckCmd = [
    'tsp',
    `-I srt ${config.inputUrl}`,
    // Service Descriptor Table
    '-P sdt',
    `--service ${config.serviceId}`,
    `--name "${config.serviceName}"`,
    `--provider "${config.provider}"`,
    // PID remapping
    '-P remap 211=256 221=257',
    // PMT configuration
    '-P pmt',
    `--service ${config.serviceId}`,
    '--add-pid 256/0x1b', // H.264 video
    '--add-pid 257/0x0f', // AAC audio
    `--add-pid ${config.scteDataPid}/0x86`, // SCTE35
    // SCTE35 Splice Injection
    '-P spliceinject',
    `--pid ${config.scteDataPid}`,
    '--pts-pid 256',
    `--files ${xmlFilePath}`,
    '--inject-count 1',
    '--inject-interval 1000',
    `--start-delay ${config.preRollSeconds * 1000}`,
    // Output configuration
    '-O srt',
    `--caller ${outputHost}:${outputPort}`,
    `--latency ${config.latency}`,
    `--streamid #!::r=scte/scte,m=publish`
  ]
  
  return tsduckCmd.join(' ')
}