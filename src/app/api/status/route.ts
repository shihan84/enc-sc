import { NextResponse } from 'next/server'

interface StreamStatus {
  input: {
    connected: boolean
    bitrate: number
    packets: number
    errors: number
  }
  output: {
    connected: boolean
    bitrate: number
    packets: number
  }
  scte35: {
    lastMarker: string | null
    totalMarkers: number
    autoInsert: boolean
    preRoll: number
    eventId: string
    cueType: string
    adDuration: number
  }
  system: {
    cpu: number
    memory: number
    uptime: number
    temperature: number
  }
  // Distributor Specifications
  video: {
    resolution: string
    codec: string
    bitrate: number
    gop: number
    bFrames: number
    profileLevel: string
    chroma: string
    aspectRatio: string
  }
  audio: {
    codec: string
    bitrate: number
    lkfs: number
    samplingRate: number
  }
  pids: {
    scteDataPid: number
    nullPid: number
  }
}

export async function GET(): Promise<NextResponse<StreamStatus>> {
  // Simulate current stream status with distributor specifications
  // In a real implementation, you would query TSDuck process status
  const status: StreamStatus = {
    input: {
      connected: Math.random() > 0.1, // 90% chance of being connected
      bitrate: 5000,
      packets: Math.floor(Math.random() * 1000000),
      errors: Math.floor(Math.random() * 10)
    },
    output: {
      connected: Math.random() > 0.1, // 90% chance of being connected
      bitrate: 5000,
      packets: Math.floor(Math.random() * 1000000)
    },
    scte35: {
      lastMarker: Math.random() > 0.5 ? `scte35_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
      totalMarkers: Math.floor(Math.random() * 100),
      autoInsert: true,
      preRoll: 0,
      eventId: '100023',
      cueType: 'CUE-OUT',
      adDuration: 600
    },
    system: {
      cpu: Math.floor(Math.random() * 30) + 5, // 5-35%
      memory: Math.floor(Math.random() * 200) + 100, // 100-300MB
      uptime: Math.floor(Math.random() * 3600), // 0-3600 seconds
      temperature: Math.floor(Math.random() * 20) + 35 // 35-55°C
    },
    // Distributor Specifications
    video: {
      resolution: '1920x1080',
      codec: 'H.264',
      bitrate: 5000,
      gop: 12,
      bFrames: 5,
      profileLevel: 'High@Auto',
      chroma: '4:2:0',
      aspectRatio: '16:9'
    },
    audio: {
      codec: 'AAC-LC',
      bitrate: 128,
      lkfs: -20,
      samplingRate: 48000
    },
    pids: {
      scteDataPid: 500,
      nullPid: 8191
    }
  }

  return NextResponse.json(status)
}