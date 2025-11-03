# SCTE35 Stream Encoder

A professional 1U rack-style encoder interface for inserting SCTE35 markers into SRT streams using TSDuck.

## Features

### 🎥 Stream Configuration
- **Input/Output SRT Streams**: Configure source and destination SRT URLs
- **Codec Support**: H.264, H.265, MPEG-2
- **Resolution Options**: 1080p, 720p, 4K
- **Bitrate Control**: Adjustable bitrate settings
- **Frame Rate**: 30/60/25 FPS support

### ⚡ SCTE35 Marker Management
- **Splice Types**: Program start/end, commercial start/end, provider ads
- **Pre-roll Configuration**: Adjustable pre-roll timing (0-30 seconds)
- **Auto Insert**: Automatic marker insertion capability
- **Manual Insert**: On-demand marker insertion
- **Real-time Monitoring**: Track marker insertion status

### 📊 Professional Monitoring
- **Stream Status**: Real-time input/output connection monitoring
- **Performance Metrics**: Bitrate, packet count, error tracking
- **SCTE35 Statistics**: Marker count and last insertion tracking
- **System Monitoring**: CPU, memory, temperature, uptime

### 🎛️ 1U Rack Design
- **Professional Interface**: Authentic rack-mount encoder appearance
- **Tabbed Navigation**: Stream config, SCTE35 markers, monitoring
- **Settings Panel**: Advanced configuration dropdown
- **Status Indicators**: Visual feedback for all operations

## Technical Stack

- **Frontend**: Next.js 15 with TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Backend**: Next.js API routes
- **Streaming**: TSDuck integration (simulated)
- **Real-time Updates**: Status polling every 2 seconds

## API Endpoints

### Stream Control
- `POST /api/stream/start` - Start encoding process
- `POST /api/stream/stop` - Stop encoding process
- `GET /api/status` - Get current stream status

### SCTE35 Operations
- `POST /api/scte35/insert` - Insert SCTE35 marker

## Usage

1. **Configure Streams**: Set input and output SRT URLs
2. **Adjust Settings**: Configure bitrate, resolution, codec
3. **Setup SCTE35**: Choose splice type and pre-roll timing
4. **Start Encoding**: Begin the streaming process
5. **Insert Markers**: Use manual or automatic SCTE35 insertion
6. **Monitor**: Track performance in the monitoring tab

## Configuration Options

### Advanced Settings
- Buffer size adjustment
- Latency configuration
- Bandwidth limiting
- SCTE35 PID settings
- Table ID configuration
- PTS offset control

## Note

This is a demonstration interface that simulates TSDuck functionality. In a production environment, you would need to:

1. Install TSDuck on the server
2. Configure actual SRT stream endpoints
3. Implement proper process management for TSDuck commands
4. Add authentication and security measures
5. Implement proper error handling and logging

## Development

```bash
npm run dev    # Start development server
npm run lint   # Check code quality
npm run build  # Build for production
```

The application runs on port 3000 and provides a professional encoder interface suitable for broadcast environments.