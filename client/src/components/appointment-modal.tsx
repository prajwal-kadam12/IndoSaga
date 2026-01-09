import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Calendar, Clock, Video, Users, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth0 } from '@auth0/auth0-react';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppointmentModal({ isOpen, onClose }: AppointmentModalProps) {
  const { toast } = useToast();
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    appointmentDate: "",
    appointmentTime: "",
    meetingType: "virtual_showroom",
    notes: ""
  });
  const [appointmentId, setAppointmentId] = useState<string>("");

  // Check if user is authenticated
  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Pre-fill form with user data if logged in
  useState(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.name || "",
        customerEmail: user.email || "",
        customerPhone: user.phone || "",
      }));
    }
  });

  const bookAppointmentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const appointmentDateTime = new Date(`${data.appointmentDate}T${data.appointmentTime}`);
      
      const response = await apiRequest('POST', '/api/appointments', {
        ...data,
        appointmentDate: appointmentDateTime.toISOString(),
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAppointmentId(data.id);
      setStep(3);
      toast({
        title: "Appointment booked successfully!",
        description: `Your virtual meeting is scheduled. Check your email for confirmation.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error booking appointment",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone || 
        !formData.appointmentDate || !formData.appointmentTime) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const appointmentDateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);
    const now = new Date();
    
    if (appointmentDateTime <= now) {
      toast({
        title: "Please select a future date and time",
        variant: "destructive",
      });
      return;
    }

    setStep(2);
  };

  const confirmBooking = () => {
    if (!isAuthenticated) {
      // Store appointment data in sessionStorage for after authentication
      sessionStorage.setItem('pendingAction', 'book-appointment');
      sessionStorage.setItem('pendingAppointmentData', JSON.stringify(formData));
      
      // Redirect to Auth0 authentication
      loginWithRedirect({
        appState: {
          returnTo: '/callback'
        }
      });
    } else {
      // User is already authenticated, book directly
      bookAppointmentMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      customerName: user?.name || "",
      customerEmail: user?.email || "",
      customerPhone: user?.phone || "",
      appointmentDate: "",
      appointmentTime: "",
      meetingType: "virtual_showroom",
      notes: ""
    });
    setAppointmentId("");
  };

  const closeModal = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  // Get minimum date (today)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  // Generate time slots (filtered for today)
  const allTimeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", 
    "16:00", "16:30", "17:00", "17:30", "18:00"
  ];

  // Helper function to get available time slots for a specific date
  const getAvailableTimeSlotsForDate = (dateString: string) => {
    if (!dateString) return allTimeSlots;
    
    const selectedDate = new Date(dateString);
    const currentDate = new Date();
    
    // If selected date is today, filter out past times
    if (selectedDate.toDateString() === currentDate.toDateString()) {
      const currentTime = currentDate.getHours() * 100 + currentDate.getMinutes();
      
      return allTimeSlots.filter(timeSlot => {
        const [hours, minutes] = timeSlot.split(':').map(Number);
        const slotTime = hours * 100 + minutes;
        // Add 30 minutes buffer to current time
        return slotTime > currentTime + 30;
      });
    }
    
    // For future dates, show all time slots
    return allTimeSlots;
  };

  // Filter time slots to show only future times if today is selected
  const getAvailableTimeSlots = () => {
    return getAvailableTimeSlotsForDate(formData.appointmentDate);
  };

  const timeSlots = getAvailableTimeSlots();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-accent to-primary p-6 rounded-t-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-3">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Book Virtual Meeting</h2>
                <p className="text-white/90 text-sm">Schedule a personal furniture consultation</p>
              </div>
            </div>
            <Button
              onClick={closeModal}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>1</div>
              <span className="text-sm font-medium">Details</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300" />
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>2</div>
              <span className="text-sm font-medium">Confirm</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300" />
            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                {step >= 3 ? <CheckCircle className="w-4 h-4" /> : '3'}
              </div>
              <span className="text-sm font-medium">Booked</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Booking Form */}
          {step === 1 && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Meeting Type Selection */}
              <div>
                <Card className="border-primary/20 shadow-lg h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">Meeting Types</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.meetingType === 'virtual_showroom' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, meetingType: 'virtual_showroom' }))}
                    >
                      <div className="flex items-center space-x-3">
                        <Video className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-medium text-sm">Virtual Showroom</div>
                          <div className="text-xs text-gray-600">Live furniture tour</div>
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.meetingType === 'consultation' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, meetingType: 'consultation' }))}
                    >
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-medium text-sm">Design Consultation</div>
                          <div className="text-xs text-gray-600">Personalized advice</div>
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.meetingType === 'product_demo' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, meetingType: 'product_demo' }))}
                    >
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-medium text-sm">Product Demo</div>
                          <div className="text-xs text-gray-600">Specific item showcase</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Booking Form */}
              <div className="lg:col-span-2">
                <Card className="border-primary/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">Appointment Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Your Name *
                          </label>
                          <Input
                            value={formData.customerName}
                            onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                            placeholder="Enter your full name"
                            className="border-primary/20 focus:border-primary"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Email Address *
                          </label>
                          <Input
                            type="email"
                            value={formData.customerEmail}
                            onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                            placeholder="your.email@example.com"
                            className="border-primary/20 focus:border-primary"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Phone Number *
                        </label>
                        <Input
                          value={formData.customerPhone}
                          onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                          placeholder="+91 98765 43210"
                          className="border-primary/20 focus:border-primary"
                          required
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Preferred Date *
                          </label>
                          <Input
                            type="date"
                            value={formData.appointmentDate}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              setFormData(prev => {
                                // Reset time if current time is not available for the new date
                                const newAvailableSlots = getAvailableTimeSlotsForDate(newDate);
                                const currentTime = prev.appointmentTime;
                                const isTimeStillAvailable = newAvailableSlots.includes(currentTime);
                                
                                return {
                                  ...prev,
                                  appointmentDate: newDate,
                                  appointmentTime: isTimeStillAvailable ? currentTime : ""
                                };
                              });
                            }}
                            min={minDate}
                            className="border-primary/20 focus:border-primary"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Preferred Time *
                          </label>
                          <select
                            value={formData.appointmentTime}
                            onChange={(e) => setFormData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                            className="w-full px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:border-primary"
                            required
                          >
                            <option value="">Select time</option>
                            {timeSlots.map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Additional Notes
                        </label>
                        <Textarea
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Tell us about your furniture needs, room dimensions, or any specific requirements..."
                          rows={3}
                          className="border-green-200 focus:border-green-500 resize-none"
                        />
                      </div>

                      <div className="flex justify-end space-x-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={closeModal}
                          className="border-primary/20 hover:border-primary"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="bg-gradient-to-r from-accent to-primary text-white hover:shadow-lg transition-all duration-300"
                        >
                          Continue
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step 2: Confirmation */}
          {step === 2 && (
            <div className="max-w-2xl mx-auto">
              <Card className="border-primary/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-center">Confirm Your Appointment</CardTitle>
                  <p className="text-center text-gray-600">Please review your appointment details</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-6 rounded-lg">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Contact Information</h4>
                        <div className="space-y-1 text-sm">
                          <div><strong>Name:</strong> {formData.customerName}</div>
                          <div><strong>Email:</strong> {formData.customerEmail}</div>
                          <div><strong>Phone:</strong> {formData.customerPhone}</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Appointment Details</h4>
                        <div className="space-y-1 text-sm">
                          <div><strong>Date:</strong> {new Date(formData.appointmentDate).toLocaleDateString()}</div>
                          <div><strong>Time:</strong> {formData.appointmentTime}</div>
                          <div><strong>Type:</strong> {formData.meetingType.replace('_', ' ').toUpperCase()}</div>
                        </div>
                      </div>
                    </div>
                    {formData.notes && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-2">Notes</h4>
                        <p className="text-sm text-gray-600">{formData.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">What to Expect:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• You'll receive a confirmation email with the video call link</li>
                      <li>• Our furniture expert will call you at the scheduled time</li>
                      <li>• We'll provide a live virtual tour of our showroom</li>
                      <li>• Feel free to ask questions about any furniture piece</li>
                    </ul>
                  </div>

                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="border-primary/20 hover:border-primary"
                    >
                      Back to Edit
                    </Button>
                    <Button
                      onClick={confirmBooking}
                      disabled={bookAppointmentMutation.isPending}
                      className="bg-gradient-to-r from-accent to-primary text-white hover:shadow-lg transition-all duration-300"
                    >
                      {bookAppointmentMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Booking...
                        </>
                      ) : (
                        <>
                          <Calendar className="w-4 h-4 mr-2" />
                          Confirm Booking
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8">
                <div className="bg-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-primary mb-4">Appointment Confirmed!</h3>
                <p className="text-primary/80 mb-6">
                  Your virtual meeting has been successfully booked for {new Date(formData.appointmentDate).toLocaleDateString()} at {formData.appointmentTime}.
                </p>

                <div className="bg-white rounded-lg p-6 text-left mb-6">
                  <h4 className="font-bold text-gray-800 mb-4">Next Steps:</h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                      <div>
                        <div className="font-medium">Check Your Email</div>
                        <div className="text-sm text-gray-600">Confirmation details sent to {formData.customerEmail}</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                      <div>
                        <div className="font-medium">Join the Video Call</div>
                        <div className="text-sm text-gray-600">Use the link in your email to join at the scheduled time</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                      <div>
                        <div className="font-medium">Enjoy Your Virtual Tour</div>
                        <div className="text-sm text-gray-600">Our expert will show you our furniture collection live</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={closeModal}
                  className="bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg transition-all duration-300"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}