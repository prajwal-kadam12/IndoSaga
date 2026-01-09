import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, MessageCircle, Send, Phone, Mail, Clock, Headphones } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth0 } from '@auth0/auth0-react';

interface HelpdeskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpdeskModal({ isOpen, onClose }: HelpdeskModalProps) {
  const { toast } = useToast();
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    subject: "",
    message: "",
    priority: "medium"
  });

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

  const submitTicketMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/support/tickets', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Support ticket created successfully!",
        description: `Your ticket #${data.ticketId} has been submitted. We'll respond within 24 hours.`,
      });
      onClose();
      setFormData({
        customerName: user?.name || "",
        customerEmail: user?.email || "",
        customerPhone: user?.phone || "",
        subject: "",
        message: "",
        priority: "medium"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting ticket",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerEmail || !formData.subject || !formData.message) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated) {
      // Store support ticket data in sessionStorage for after authentication
      sessionStorage.setItem('pendingAction', 'submit-ticket');
      sessionStorage.setItem('pendingSupportTicketData', JSON.stringify(formData));
      
      // Redirect to Auth0 authentication
      loginWithRedirect({
        appState: {
          returnTo: '/callback'
        }
      });
    } else {
      // User is already authenticated, submit directly
      submitTicketMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent p-6 rounded-t-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-3">
                <Headphones className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Customer Support</h2>
                <p className="text-white/90 text-sm">Get help from our furniture experts</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 p-6">
          {/* Contact Information */}
          <div className="space-y-6">
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <span>Quick Contact</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-primary/5 rounded-lg">
                  <Phone className="w-4 h-4 text-primary" />
                  <div>
                    <div className="font-medium text-sm">Phone Support</div>
                    <div className="text-xs text-gray-600">+91 98765 43210</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-accent/5 rounded-lg">
                  <Mail className="w-4 h-4 text-accent" />
                  <div>
                    <div className="font-medium text-sm">Email Support</div>
                    <div className="text-xs text-gray-600">help@indosaga.com</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <Clock className="w-4 h-4 text-green-600" />
                  <div>
                    <div className="font-medium text-sm">Response Time</div>
                    <div className="text-xs text-gray-600">Within 24 hours</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Support Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span className="font-medium">9 AM - 8 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span className="font-medium">10 AM - 6 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span className="font-medium">10 AM - 4 PM</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Support Form */}
          <div className="md:col-span-2">
            <Card className="border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Submit a Support Ticket</CardTitle>
                <p className="text-gray-600 text-sm">
                  Tell us about your issue and we'll get back to you as soon as possible.
                </p>
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

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Phone Number
                      </label>
                      <Input
                        value={formData.customerPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                        placeholder="+91 98765 43210"
                        className="border-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Priority Level
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:border-primary"
                      >
                        <option value="low">Low - General inquiry</option>
                        <option value="medium">Medium - Standard support</option>
                        <option value="high">High - Urgent issue</option>
                        <option value="urgent">Urgent - Critical problem</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Subject *
                    </label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Brief description of your issue"
                      className="border-primary/20 focus:border-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Message *
                    </label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Please describe your issue in detail. Include any relevant order numbers or product information."
                      rows={5}
                      className="border-primary/20 focus:border-primary resize-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="border-primary/20 hover:border-primary"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitTicketMutation.isPending}
                      className="bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg transition-all duration-300"
                    >
                      {submitTicketMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Ticket
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Help Section */}
        <div className="bg-gray-50 p-6 rounded-b-3xl">
          <h3 className="font-bold text-lg mb-4">Common Questions</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-medium text-sm mb-2">Delivery Information</h4>
              <p className="text-xs text-gray-600">Standard delivery takes 5-7 business days</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-medium text-sm mb-2">Return Policy</h4>
              <p className="text-xs text-gray-600">30-day return policy for all furniture</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-medium text-sm mb-2">Assembly Service</h4>
              <p className="text-xs text-gray-600">Free assembly available in metro cities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}