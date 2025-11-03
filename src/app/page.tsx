'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play, 
  Square, 
  Settings, 
  Radio, 
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  Power,
  Signal,
  Zap,
  Monitor,
  Server,
  ArrowRight
} from 'lucide-react'

export default function SCTE35Encoder() {
  const [isEncoding, setIsEncoding] = useState(false)
  const [streamStatus, setStreamStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle')
  const [settingsOpen, setSettingsOpen] = useState(false)
  
  // Stream Configuration
  const [streamName, setStreamName] = useState('SCTE-35 Stream')
  const [serviceName, setServiceName] = useState('SCTE-35 Stream')
  const [provider, setProvider] = useState('ITAssist')
  const [serviceId, setServiceId] = useState(1)
  const [inputUrl, setInputUrl] = useState('https://cdn.itassist.one/BREAKING/NEWS/index.m3u8')
  const [outputUrl, setOutputUrl] = useState('srt://cdn.itassist.one:8888')
  
  // Video Specifications (Distributor Requirements)
  const [videoResolution] = useState('1920x1080')
  const [videoCodec] = useState('H.264')
  const [videoBitrate] = useState('5000') // 5 Mbps
  const [gop] = useState('12')
  const [bFrames] = useState('5')
  const [profileLevel] = useState('High@Auto')
  const [chroma] = useState('4:2:0')
  const [aspectRatio] = useState('16:9')
  const [pcr] = useState('Video Embedded')
  
  // Audio Specifications (Distributor Requirements)
  const [audioCodec] = useState('AAC-LC')
  const [audioBitrate] = useState('128') // 128 Kbps
  const [audioLkfs] = useState('-20') // -20 db
  const [audioSamplingRate] = useState('48000') // 48 Khz
  
  // SCTE35 Configuration
  const [preRollSeconds, setPreRollSeconds] = useState('2') // 0-10 seconds
  const [spliceType, setSpliceType] = useState('CUE-OUT')
  const [autoInsert, setAutoInsert] = useState(true)
  const [adDuration, setAdDuration] = useState('600') // Ad duration in seconds
  const [scteEventId, setScteEventId] = useState('10023') // Sequential Event ID
  const [lastEventId, setLastEventId] = useState('10023')
  
  // PID Configuration
  const [scteDataPid] = useState('500')
  const [nullPid] = useState('8191')
  const [latency] = useState('2000') // 2 seconds
  
  // State Management
  const [streamId, setStreamId] = useState<string | null>(null)
  const [streamPid, setStreamPid] = useState<number | null>(null)
  const [uptime, setUptime] = useState(0)
  const [statusData, setStatusData] = useState<any>(null)

  // Update uptime every second when encoding
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isEncoding) {
      interval = setInterval(() => {
        setUptime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isEncoding])

  // Fetch status data every 2 seconds when encoding
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isEncoding) {
      interval = setInterval(async () => {
        try {
          const response = await fetch('/api/status')
          if (response.ok) {
            const data = await response.json()
            setStatusData(data)
          }
        } catch (error) {
          console.error('Failed to fetch status:', error)
        }
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [isEncoding])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = () => {
    switch (streamStatus) {
      case 'idle': return 'bg-gray-500'
      case 'connecting': return 'bg-yellow-500 animate-pulse'
      case 'active': return 'bg-green-500 animate-pulse'
      case 'error': return 'bg-red-500 animate-pulse'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (streamStatus) {
      case 'idle': return 'IDLE'
      case 'connecting': return 'CONNECTING'
      case 'active': return 'ACTIVE'
      case 'error': return 'ERROR'
      default: return 'IDLE'
    }
  }

  const handleStartEncoding = async () => {
    try {
      setIsEncoding(true)
      setStreamStatus('connecting')
      
      const response = await fetch('/api/stream/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamName,
          inputUrl,
          outputUrl,
          // Service Configuration
          serviceName,
          provider,
          serviceId,
          // Video Specifications
          videoResolution,
          videoCodec,
          videoBitrate: parseInt(videoBitrate),
          gop: parseInt(gop),
          bFrames: parseInt(bFrames),
          profileLevel,
          chroma,
          aspectRatio,
          pcr,
          // Audio Specifications
          audioCodec,
          audioBitrate: parseInt(audioBitrate),
          audioLkfs: parseInt(audioLkfs),
          audioSamplingRate: parseInt(audioSamplingRate),
          // PID Configuration
          scteDataPid: parseInt(scteDataPid),
          nullPid: parseInt(nullPid),
          latency: parseInt(latency)
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setStreamId(data.streamId)
        setStreamStatus('active')
        console.log('TSDuck Command:', data.command)
      } else {
        setStreamStatus('error')
        setIsEncoding(false)
      }
    } catch (error) {
      console.error('Failed to start encoding:', error)
      setStreamStatus('error')
      setIsEncoding(false)
    }
  }

  const handleStopEncoding = async () => {
    try {
      if (streamId && streamPid) {
        await fetch('/api/stream/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streamId,
            pid: streamPid
          })
        })
      }
      
      setIsEncoding(false)
      setStreamStatus('idle')
      setStreamId(null)
      setStreamPid(null)
      setUptime(0)
    } catch (error) {
      console.error('Failed to stop encoding:', error)
    }
  }

  const handleInsertMarker = async () => {
    try {
      // Increment Event ID for sequential numbering
      const newEventId = (parseInt(lastEventId) + 1).toString()
      setScteEventId(newEventId)
      setLastEventId(newEventId)
      
      const response = await fetch('/api/scte35/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputUrl,
          outputUrl,
          preRollSeconds: parseInt(preRollSeconds),
          spliceType,
          autoInsert,
          // SCTE35 Parameters
          adDuration: parseInt(adDuration),
          scteEventId: newEventId,
          scteDataPid: parseInt(scteDataPid),
          nullPid: parseInt(nullPid),
          latency: parseInt(latency),
          // Service Configuration
          serviceName,
          provider,
          serviceId
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('SCTE35 marker injected successfully')
        console.log('TSDuck Command:', data.command)
        console.log('XML File:', data.xmlFile)
      }
    } catch (error) {
      console.error('Failed to inject SCTE35 marker:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4">
      {/* 1U Rack Enclosure Header */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-t-lg border-2 border-gray-700 border-b-0 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Server className="w-6 h-6 text-blue-400" />
                <h1 className="text-xl font-bold">SCTE35 Stream Encoder</h1>
              </div>
              <Badge variant="outline" className="text-xs">TS-DUCK v3.40</Badge>
              <Badge variant="secondary" className="text-xs">{streamName}</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
                <span className="text-sm font-mono">{getStatusText()}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Rack Panel */}
        <div className="bg-gray-800 border-2 border-gray-700 border-t-0">
          <div className="p-6">
            <Tabs defaultValue="stream" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-700">
                <TabsTrigger value="stream" className="data-[state=active]:bg-gray-600">
                  <Radio className="w-4 h-4 mr-2" />
                  Stream Config
                </TabsTrigger>
                <TabsTrigger value="scte35" className="data-[state=active]:bg-gray-600">
                  <Zap className="w-4 h-4 mr-2" />
                  SCTE35 Markers
                </TabsTrigger>
                <TabsTrigger value="monitor" className="data-[state=active]:bg-gray-600">
                  <Monitor className="w-4 h-4 mr-2" />
                  Monitor
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stream" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Stream Configuration */}
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Radio className="w-5 h-5 mr-2 text-blue-400" />
                        Stream Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="stream-name" className="text-sm text-gray-300">Stream Name</Label>
                        <Input
                          id="stream-name"
                          value={streamName}
                          onChange={(e) => setStreamName(e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white mt-1"
                          placeholder="SCTE-35 Stream"
                        />
                      </div>
                      <div>
                        <Label htmlFor="service-name" className="text-sm text-gray-300">Service Name</Label>
                        <Input
                          id="service-name"
                          value={serviceName}
                          onChange={(e) => setServiceName(e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white mt-1"
                          placeholder="SCTE-35 Stream"
                        />
                      </div>
                      <div>
                        <Label htmlFor="provider" className="text-sm text-gray-300">Provider</Label>
                        <Input
                          id="provider"
                          value={provider}
                          onChange={(e) => setProvider(e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white mt-1"
                          placeholder="ITAssist"
                        />
                      </div>
                      <div>
                        <Label htmlFor="service-id" className="text-sm text-gray-300">Service ID</Label>
                        <Input
                          id="service-id"
                          type="number"
                          value={serviceId}
                          onChange={(e) => setServiceId(parseInt(e.target.value))}
                          className="bg-gray-800 border-gray-600 text-white mt-1"
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="input-url" className="text-sm text-gray-300">Input URL (HLS/SRT)</Label>
                        <Input
                          id="input-url"
                          value={inputUrl}
                          onChange={(e) => setInputUrl(e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white mt-1"
                          placeholder="https://cdn.itassist.one/BREAKING/NEWS/index.m3u8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="output-url" className="text-sm text-gray-300">Output URL (SRT)</Label>
                        <Input
                          id="output-url"
                          value={outputUrl}
                          onChange={(e) => setOutputUrl(e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white mt-1"
                          placeholder="srt://cdn.itassist.one:8888"
                        />
                      </div>
                      <div>
                        <Label htmlFor="latency" className="text-sm text-gray-300">Latency (ms)</Label>
                        <Input
                          id="latency"
                          value={latency}
                          onChange={(e) => setLatency(e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white mt-1"
                          placeholder="2000"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Video Specifications */}
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Monitor className="w-5 h-5 mr-2 text-green-400" />
                        Video Specifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-300">Resolution</Label>
                          <Input
                            value={videoResolution}
                            disabled
                            className="bg-gray-800 border-gray-600 text-white mt-1 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-300">Codec</Label>
                          <Input
                            value={videoCodec}
                            disabled
                            className="bg-gray-800 border-gray-600 text-white mt-1 text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-300">Bitrate</Label>
                          <Input
                            value={`${videoBitrate} Mbps`}
                            disabled
                            className="bg-gray-800 border-gray-600 text-white mt-1 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-300">Profile@Level</Label>
                          <Input
                            value={profileLevel}
                            disabled
                            className="bg-gray-800 border-gray-600 text-white mt-1 text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-sm text-gray-300">GOP</Label>
                          <Input
                            value={gop}
                            disabled
                            className="bg-gray-800 border-gray-600 text-white mt-1 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-300">B-Frames</Label>
                          <Input
                            value={bFrames}
                            disabled
                            className="bg-gray-800 border-gray-600 text-white mt-1 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-300">Chroma</Label>
                          <Input
                            value={chroma}
                            disabled
                            className="bg-gray-800 border-gray-600 text-white mt-1 text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-300">Aspect Ratio</Label>
                          <Input
                            value={aspectRatio}
                            disabled
                            className="bg-gray-800 border-gray-600 text-white mt-1 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-300">PCR</Label>
                          <Input
                            value={pcr}
                            disabled
                            className="bg-gray-800 border-gray-600 text-white mt-1 text-xs"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Audio Specifications */}
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-orange-400" />
                        Audio Specifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-300">Codec</Label>
                          <Input
                            value={audioCodec}
                            disabled
                            className="bg-gray-800 border-gray-600 text-white mt-1 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-300">Bitrate</Label>
                          <Input
                            value={`${audioBitrate} Kbps`}
                            disabled
                            className="bg-gray-800 border-gray-600 text-white mt-1 text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-300">LKFS</Label>
                          <Input
                            value={`${audioLkfs} dB`}
                            disabled
                            className="bg-gray-800 border-gray-600 text-white mt-1 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-300">Sample Rate</Label>
                          <Input
                            value={`${audioSamplingRate} Hz`}
                            disabled
                            className="bg-gray-800 border-gray-600 text-white mt-1 text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-300">SCTE Data PID</Label>
                          <Input
                            value={scteDataPid}
                            onChange={(e) => setScteDataPid(e.target.value)}
                            className="bg-gray-800 border-gray-600 text-white mt-1 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-gray-300">Null PID</Label>
                          <Input
                            value={nullPid}
                            onChange={(e) => setNullPid(e.target.value)}
                            className="bg-gray-800 border-gray-600 text-white mt-1 text-xs"
                          />
                        </div>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <h4 className="text-sm font-semibold text-green-400 mb-2">TSDuck Configuration</h4>
                        <div className="text-xs space-y-1">
                          <p><span className="text-gray-400">PID Remap:</span> 211→256, 221→257</p>
                          <p><span className="text-gray-400">Video PID:</span> 256 (0x1b)</p>
                          <p><span className="text-gray-400">Audio PID:</span> 257 (0x0f)</p>
                          <p><span className="text-gray-400">SCTE35 PID:</span> {scteDataPid} (0x86)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Control Panel */}
                <Card className="bg-gray-700 border-gray-600 mt-6">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Button
                          onClick={handleStartEncoding}
                          disabled={isEncoding}
                          className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
                        >
                          <Play className="w-4 h-4" />
                          <span>Start Encoding</span>
                        </Button>
                        <Button
                          onClick={handleStopEncoding}
                          disabled={!isEncoding}
                          variant="destructive"
                          className="flex items-center space-x-2"
                        >
                          <Square className="w-4 h-4" />
                          <span>Stop</span>
                        </Button>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <Activity className="w-4 h-4 text-green-400" />
                          <span className="text-sm">Signal: Good</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span className="text-sm">{formatTime(uptime)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {videoBitrate} Mbps / {audioBitrate} Kbps
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="scte35" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* SCTE35 Configuration */}
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                        SCTE35 Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="splice-type" className="text-sm text-gray-300">Cue Type</Label>
                        <Select value={spliceType} onValueChange={setSpliceType}>
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="CUE-OUT">CUE-OUT (Program Out)</SelectItem>
                            <SelectItem value="CUE-IN">CUE-IN (Program In)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="ad-duration" className="text-sm text-gray-300">Ad Duration (seconds)</Label>
                        <Input
                          id="ad-duration"
                          type="number"
                          value={adDuration}
                          onChange={(e) => setAdDuration(e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white mt-1"
                          placeholder="600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="event-id" className="text-sm text-gray-300">SCTE Event ID</Label>
                        <Input
                          id="event-id"
                          value={scteEventId}
                          onChange={(e) => setScteEventId(e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white mt-1"
                          placeholder="100023"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pre-roll" className="text-sm text-gray-300">Pre-roll (0-10 seconds)</Label>
                        <Input
                          id="pre-roll"
                          type="number"
                          value={preRollSeconds}
                          onChange={(e) => setPreRollSeconds(e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white mt-1"
                          min="0"
                          max="10"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-insert" className="text-sm text-gray-300">Auto Insert</Label>
                        <Switch
                          id="auto-insert"
                          checked={autoInsert}
                          onCheckedChange={setAutoInsert}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* SCTE35 Transport Stream Info */}
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2 text-orange-400" />
                        SCTE35 Transport Stream
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-gray-800 p-4 rounded-lg space-y-2">
                        <h4 className="text-sm font-semibold text-green-400">TSDuck spliceinject Command</h4>
                        <div className="text-xs space-y-1 font-mono bg-gray-900 p-2 rounded">
                          <p>tsp -I srt {inputUrl}</p>
                          <p>-P spliceinject --pid {scteDataPid}</p>
                          <p>--pts-pid 256 --files preroll_{scteEventId}_*.xml</p>
                          <p>--inject-count 1 --inject-interval 1000</p>
                          <p>--start-delay {preRollSeconds}000</p>
                          <p>-O srt --caller cdn.itassist.one:8888</p>
                          <p>--latency {latency} --streamid #!::r=scte/scte,m=publish</p>
                        </div>
                        <div className="text-xs space-y-1 pt-2 border-t border-gray-700">
                          <p><span className="text-gray-400">Ad Duration:</span> <span className="text-white">{adDuration}s</span></p>
                          <p><span className="text-gray-400">Event ID:</span> <span className="text-white">{scteEventId}</span> (Sequential)</p>
                          <p><span className="text-gray-400">CUE-OUT:</span> <span className="text-white">Program Out Point</span></p>
                          <p><span className="text-gray-400">CUE-IN:</span> <span className="text-white">Program In Point</span></p>
                          <p><span className="text-gray-400">Crash Out:</span> <span className="text-white">Early CUE-IN</span></p>
                          <p><span className="text-gray-400">Pre-roll:</span> <span className="text-white">{preRollSeconds}s</span></p>
                          <p><span className="text-gray-400">SCTE Data PID:</span> <span className="text-white">{scteDataPid}</span></p>
                        </div>
                      </div>
                      <Button
                        onClick={handleInsertMarker}
                        disabled={!isEncoding}
                        className="w-full bg-orange-600 hover:bg-orange-700 flex items-center justify-center space-x-2"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Insert {spliceType} Marker</span>
                      </Button>
                      <div className="text-sm text-gray-400 space-y-2">
                        <p>• Manual insertion requires active encoding</p>
                        <p>• Event ID increments automatically</p>
                        <p>• CUE-OUT starts ad break</p>
                        <p>• CUE-IN ends ad break (crash out support)</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="monitor" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Stream Status */}
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Signal className="w-5 h-5 mr-2 text-green-400" />
                        Stream Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Input</span>
                        <Badge variant={statusData?.input?.connected ? 'default' : 'secondary'}>
                          {statusData?.input?.connected ? 'Connected' : 'Disconnected'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Output</span>
                        <Badge variant={statusData?.output?.connected ? 'default' : 'secondary'}>
                          {statusData?.output?.connected ? 'Connected' : 'Disconnected'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Bitrate</span>
                        <span className="text-sm font-mono">{statusData?.input?.bitrate || videoBitrate} Mbps</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Resolution</span>
                        <span className="text-sm font-mono">{videoResolution}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Codec</span>
                        <span className="text-sm font-mono">{videoCodec}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Packets</span>
                        <span className="text-sm font-mono">{statusData?.input?.packets?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Errors</span>
                        <span className="text-sm font-mono text-red-400">{statusData?.input?.errors || '0'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* SCTE35 Status */}
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                        SCTE35 Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Last Marker</span>
                        <span className="text-sm font-mono text-xs">
                          {statusData?.scte35?.lastMarker ? 
                            statusData.scte35.lastMarker.substring(0, 12) + '...' : 
                            'None'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Event ID</span>
                        <span className="text-sm font-mono">{scteEventId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Cue Type</span>
                        <span className="text-sm font-mono">{spliceType}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Ad Duration</span>
                        <span className="text-sm font-mono">{adDuration}s</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Total Markers</span>
                        <span className="text-sm font-mono">{statusData?.scte35?.totalMarkers || '0'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Auto Insert</span>
                        <Badge variant={statusData?.scte35?.autoInsert || autoInsert ? 'default' : 'secondary'}>
                          {statusData?.scte35?.autoInsert || autoInsert ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">SCTE PID</span>
                        <span className="text-sm font-mono">{scteDataPid}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* System Status */}
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Server className="w-5 h-5 mr-2 text-blue-400" />
                        System Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">CPU</span>
                        <span className="text-sm font-mono">{statusData?.system?.cpu || '12'}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Memory</span>
                        <span className="text-sm font-mono">{statusData?.system?.memory || '256'}MB</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Uptime</span>
                        <span className="text-sm font-mono">{formatTime(statusData?.system?.uptime || uptime)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Temperature</span>
                        <span className="text-sm font-mono">{statusData?.system?.temperature || '42'}°C</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Settings Dropdown Panel */}
        {settingsOpen && (
          <div className="bg-gray-800 border-2 border-gray-700 border-t-0 rounded-b-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Advanced Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="buffer-size" className="text-sm text-gray-300">Buffer Size (ms)</Label>
                <Input
                  id="buffer-size"
                  defaultValue="1000"
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                />
              </div>
              <div>
                <Label htmlFor="latency" className="text-sm text-gray-300">Latency (ms)</Label>
                <Input
                  id="latency"
                  defaultValue="2000"
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bandwidth" className="text-sm text-gray-300">Max Bandwidth (Mbps)</Label>
                <Input
                  id="bandwidth"
                  defaultValue="10"
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pid" className="text-sm text-gray-300">SCTE35 PID</Label>
                <Input
                  id="pid"
                  defaultValue="499"
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                />
              </div>
              <div>
                <Label htmlFor="table-id" className="text-sm text-gray-300">Table ID</Label>
                <Input
                  id="table-id"
                  defaultValue="0xFC"
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pts-offset" className="text-sm text-gray-300">PTS Offset (ms)</Label>
                <Input
                  id="pts-offset"
                  defaultValue="0"
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Save Settings
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}