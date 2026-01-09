import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Video, VideoOff, Mic, MicOff, Phone, Camera, Monitor, Users, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  customerName: string;
}

export default function VideoCallModal({ isOpen, onClose, appointmentId, customerName }: VideoCallModalProps) {
  const { toast } = useToast();
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState<'waiting' | 'connecting' | 'connected' | 'ended'>('waiting');
  const [messages, setMessages] = useState<Array<{ sender: string; message: string; time: string }>>([]);
  const [newMessage, setNewMessage] = useState("");
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      initializeCall();
    }
    return () => {
      cleanupCall();
    };
  }, [isOpen]);

  const initializeCall = async () => {
    try {
      setCallStatus('connecting');
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled
      });
      
      mediaStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Simulate connection (in real implementation, this would use WebRTC)
      setTimeout(() => {
        setCallStatus('connected');
        toast({
          title: "Connected to virtual showroom",
          description: "You are now connected with our furniture expert!",
        });
        
        // Add welcome message
        setMessages([{
          sender: "Expert",
          message: "Welcome to IndoSaga's virtual showroom! I'm here to show you our beautiful furniture collection. What type of furniture are you looking for today?",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 2000);
      
    } catch (error) {
      console.error('Error initializing call:', error);
      toast({
        title: "Camera access required",
        description: "Please allow camera and microphone access for the video call",
        variant: "destructive",
      });
      setCallStatus('ended');
    }
  };

  const cleanupCall = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const toggleVideo = async () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const toggleAudio = async () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  const endCall = () => {
    cleanupCall();
    setCallStatus('ended');
    toast({
      title: "Call ended",
      description: "Thank you for visiting our virtual showroom!",
    });
    onClose();
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      setMessages(prev => [...prev, {
        sender: "You",
        message: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setNewMessage("");

      // Simulate expert response
      setTimeout(() => {
        const responses = [
          "I can show you that piece right now! Let me walk over to it.",
          "Great choice! That's one of our bestsellers. Here are the details...",
          "Yes, we have that available in multiple colors. Let me show you.",
          "That would look perfect in your space! Here's the pricing information.",
          "I'll demonstrate the quality by showing you the construction details."
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        setMessages(prev => [...prev, {
          sender: "Expert",
          message: randomResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 pt-16 sm:pt-18 lg:pt-20 xl:pt-24 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent p-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-full p-2">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div className="text-white">
              <h2 className="text-lg font-bold">Virtual Showroom</h2>
              <p className="text-sm opacity-90">
                {callStatus === 'waiting' && "Preparing connection..."}
                {callStatus === 'connecting' && "Connecting..."}
                {callStatus === 'connected' && "Connected with furniture expert"}
                {callStatus === 'ended' && "Call ended"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              callStatus === 'connected' ? 'bg-green-500/20 text-green-300' : 
              callStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-gray-500/20 text-gray-300'
            }`}>
              {callStatus === 'connected' && '● LIVE'}
              {callStatus === 'connecting' && '○ CONNECTING'}
              {callStatus === 'waiting' && '○ WAITING'}
              {callStatus === 'ended' && '○ ENDED'}
            </div>
            
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 rounded-full w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex h-[calc(95vh-80px)]">
          {/* Main Video Area */}
          <div className="flex-1 relative bg-black">
            {/* Remote Video (Shop Owner's Camera) */}
            <div className="absolute inset-0">
              {callStatus === 'connected' ? (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  {/* Simulated remote video showing furniture showroom */}
                  <div className="text-center text-white space-y-4">
                    <Monitor className="w-24 h-24 mx-auto opacity-50" />
                    <div>
                      <h3 className="text-xl font-bold">Live Virtual Showroom</h3>
                      <p className="text-gray-300">Expert is showing furniture collection via camera</p>
                    </div>
                    <div className="bg-black/30 backdrop-blur rounded-lg p-4 max-w-md">
                      <p className="text-sm">🎥 <strong>Current View:</strong> Living Room Collection</p>
                      <p className="text-xs text-gray-300 mt-1">
                        The shop owner is showing you sofas, coffee tables, and accent chairs in real-time
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Waiting for expert to join...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Local Video (Customer's Camera) */}
            <div className="absolute bottom-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-white/20">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {customerName} (You)
              </div>
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <VideoOff className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Call Status Overlay */}
            {callStatus !== 'connected' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center text-white">
                  {callStatus === 'waiting' && (
                    <>
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white mx-auto mb-4" />
                      <p className="text-lg font-medium">Preparing your virtual showroom...</p>
                    </>
                  )}
                  {callStatus === 'connecting' && (
                    <>
                      <div className="animate-pulse">
                        <Users className="w-12 h-12 mx-auto mb-4" />
                      </div>
                      <p className="text-lg font-medium">Connecting with expert...</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Chat Panel */}
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-bold flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>Chat</span>
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs rounded-lg p-3 ${
                    msg.sender === 'You' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className="text-sm">{msg.message}</div>
                    <div className={`text-xs mt-1 ${msg.sender === 'You' ? 'text-primary-200' : 'text-gray-500'}`}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about furniture..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                  disabled={callStatus !== 'connected'}
                />
                <Button
                  onClick={sendMessage}
                  disabled={callStatus !== 'connected' || !newMessage.trim()}
                  size="sm"
                  className="px-3"
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-gray-800 p-4 flex justify-center space-x-4">
          <Button
            onClick={toggleVideo}
            variant={isVideoEnabled ? "default" : "destructive"}
            size="sm"
            className="flex items-center space-x-2"
          >
            {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            <span>{isVideoEnabled ? 'Video On' : 'Video Off'}</span>
          </Button>
          
          <Button
            onClick={toggleAudio}
            variant={isAudioEnabled ? "default" : "destructive"}
            size="sm"
            className="flex items-center space-x-2"
          >
            {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            <span>{isAudioEnabled ? 'Mic On' : 'Mic Off'}</span>
          </Button>
          
          <Button
            onClick={endCall}
            variant="destructive"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Phone className="w-4 h-4" />
            <span>End Call</span>
          </Button>
        </div>
      </div>
    </div>
  );
}