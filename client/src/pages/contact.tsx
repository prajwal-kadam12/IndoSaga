import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    inquiryType: "",
    message: ""
  });

  const submitInquiryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      toast({
        title: "Inquiry sent successfully!",
        description: "We'll get back to you within 24 hours.",
      });
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        inquiryType: "",
        message: ""
      });
    },
    onError: (error: Error) => {
      const errorMessage = error.message;
      toast({
        title: "Error sending inquiry",
        description: errorMessage || "Please try again or contact us directly.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.inquiryType || !formData.message) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    submitInquiryMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="py-10 sm:py-20 bg-gradient-to-br from-warmWhite via-beige to-primary/5 min-h-screen relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-20 left-10 w-40 h-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute top-60 right-20 w-32 h-32 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-40 left-1/4 w-28 h-28 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-60 right-1/3 w-36 h-36 bg-gradient-to-br from-primary/25 to-accent/25 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '3s' }}></div>
      <div className="absolute top-1/2 left-20 w-24 h-24 bg-gradient-to-br from-accent/25 to-secondary/25 rounded-full opacity-30 animate-bounce" style={{ animationDelay: '4s' }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-10 sm:mb-20 animate-slideInUp">
          <div className="inline-flex items-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-full px-4 sm:px-8 py-2 sm:py-3 mb-4 sm:mb-8 shadow-lg animate-slideInDown">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-primary to-accent rounded-full mr-2 sm:mr-4 animate-pulse"></div>
            <span className="text-primary font-bold text-sm sm:text-lg">Contact Us</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-bold bg-gradient-to-r from-darkBrown via-primary to-accent bg-clip-text text-transparent mb-4 sm:mb-8 animate-slideInUp">
            Get in Touch
          </h1>
          <p className="text-lg sm:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed animate-slideInUp px-4" style={{ animationDelay: '0.3s' }}>
            Visit our showroom or send us your requirements - We're here to help create your dream furniture
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-stretch">
          {/* Contact Information */}
          <div className="animate-slideInLeft h-full" style={{ animationDelay: '0.5s' }}>
            <Card className="bg-gradient-to-br from-white via-warmWhite to-accent/5 shadow-2xl border-0 relative overflow-hidden group hover:shadow-3xl transition-all duration-500 h-full flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>

              <CardHeader className="relative z-10 pb-8">
                <div className="inline-flex items-center bg-gradient-to-r from-primary/15 to-accent/15 rounded-full px-6 py-2 mb-4 shadow-lg animate-bounce" style={{ animationDelay: '0.7s' }}>
                  <span className="text-primary font-bold text-sm">Showroom Info</span>
                </div>
                <CardTitle className="text-3xl font-display font-bold bg-gradient-to-r from-darkBrown via-primary to-accent bg-clip-text text-transparent">Visit Our Showroom</CardTitle>
              </CardHeader>

              <CardContent className="space-y-8 relative z-10 flex-1">
                <div className="space-y-8">
                  {[
                    {
                      icon: MapPin,
                      title: "Address",
                      content: "123 Furniture Street, Craftsman District\nMumbai, Maharashtra 400001",
                      testId: "contact-address",
                      delay: '0.9s'
                    },
                    {
                      icon: Phone,
                      title: "Phone",
                      content: "+91 98765 43210\n+91 98765 43211",
                      testId: "contact-phone",
                      delay: '1.1s'
                    },
                    {
                      icon: Mail,
                      title: "Email",
                      content: "info@sagwanfurniture.com\norders@sagwanfurniture.com",
                      testId: "contact-email",
                      delay: '1.3s'
                    },
                    {
                      icon: Clock,
                      title: "Hours",
                      content: "Mon - Sat: 10:00 AM - 8:00 PM\nSunday: 11:00 AM - 6:00 PM",
                      testId: "contact-hours",
                      delay: '1.5s'
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start space-x-6 group/item animate-slideInRight" style={{ animationDelay: item.delay }}>
                      <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg group-hover/item:shadow-2xl transition-all duration-500 group-hover/item:scale-110 group-hover/item:rotate-12 flex-shrink-0">
                        <item.icon className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-primary mb-3 group-hover/item:text-primary/80 transition-colors duration-300">{item.title}</h4>
                        <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line group-hover/item:text-gray-700 transition-colors duration-300" data-testid={item.testId}>
                          {item.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enhanced Map Placeholder */}
                <div className="mt-12 animate-fadeInUp" style={{ animationDelay: '1.7s' }}>
                  <div className="relative group/map">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-3xl blur-lg opacity-30 group-hover/map:opacity-50 transition-opacity duration-500"></div>
                    <div className="relative w-full h-64 bg-gradient-to-br from-gray-100 to-accent/10 rounded-3xl flex items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer group-hover/map:scale-105 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover/map:opacity-100 transition-opacity duration-500"></div>
                      <div className="text-center relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg group-hover/map:animate-bounce">
                          <MapPin className="h-8 w-8 text-white" />
                        </div>
                        <p className="text-primary font-bold text-lg mb-2">Interactive Google Map</p>
                        <p className="text-primary/80 text-sm">123 Furniture Street, Mumbai</p>
                        <div className="mt-4 inline-flex items-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-full px-4 py-2 shadow-sm">
                          <span className="text-primary font-medium text-sm">Click to view directions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inquiry Form */}
          <div className="animate-slideInRight h-full" style={{ animationDelay: '0.6s' }}>
            <Card className="bg-gradient-to-br from-white via-warmWhite to-accent/5 shadow-2xl border-0 relative overflow-hidden group hover:shadow-3xl transition-all duration-500 h-full flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 left-0 w-28 h-28 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-500 transform -translate-x-10 -translate-y-10"></div>

              <CardHeader className="relative z-10 pb-8">
                <div className="inline-flex items-center bg-gradient-to-r from-primary/15 to-accent/15 rounded-full px-6 py-2 mb-4 shadow-lg animate-bounce" style={{ animationDelay: '0.8s' }}>
                  <span className="text-primary font-bold text-sm">Contact Form</span>
                </div>
                <CardTitle className="text-3xl font-display font-bold bg-gradient-to-r from-darkBrown via-primary to-accent bg-clip-text text-transparent">Send us an Inquiry</CardTitle>
              </CardHeader>

              <CardContent className="relative z-10 flex-1 px-4 sm:px-6">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-slideInUp" style={{ animationDelay: '1s' }}>
                    <div className="group">
                      <label className="block text-sm sm:text-lg font-semibold text-primary mb-2 sm:mb-3 group-focus-within:text-accent transition-colors duration-300">
                        First Name *
                      </label>
                      <Input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        className="py-3 sm:py-4 border-2 border-secondary focus:border-primary focus:ring-primary/20 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 text-darkBrown placeholder-primary/60 font-medium shadow-sm hover:shadow-md transition-all duration-300 text-sm sm:text-lg"
                        placeholder="Enter your first name"
                        required
                        data-testid="input-first-name"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm sm:text-lg font-semibold text-primary mb-2 sm:mb-3 group-focus-within:text-accent transition-colors duration-300">
                        Last Name *
                      </label>
                      <Input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        className="py-3 sm:py-4 border-2 border-secondary focus:border-primary focus:ring-primary/20 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 text-darkBrown placeholder-primary/60 font-medium shadow-sm hover:shadow-md transition-all duration-300 text-sm sm:text-lg"
                        placeholder="Enter your last name"
                        required
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>

                  <div className="group animate-slideInUp" style={{ animationDelay: '1.2s' }}>
                    <label className="block text-sm sm:text-lg font-semibold text-primary mb-2 sm:mb-3 group-focus-within:text-accent transition-colors duration-300">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="py-3 sm:py-4 border-2 border-secondary focus:border-primary focus:ring-primary/20 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 text-darkBrown placeholder-primary/60 font-medium shadow-sm hover:shadow-md transition-all duration-300 text-sm sm:text-lg"
                      placeholder="Enter your email address"
                      required
                      data-testid="input-email"
                    />
                  </div>

                  <div className="group animate-slideInUp" style={{ animationDelay: '1.4s' }}>
                    <label className="block text-lg font-semibold text-primary mb-3 group-focus-within:text-accent transition-colors duration-300">
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="py-4 border-2 border-secondary focus:border-primary focus:ring-primary/20 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 text-darkBrown placeholder-primary/60 font-medium shadow-sm hover:shadow-md transition-all duration-300 text-lg"
                      placeholder="Enter your phone number"
                      data-testid="input-phone"
                    />
                  </div>

                  <div className="group animate-slideInUp" style={{ animationDelay: '1.6s' }}>
                    <label className="block text-lg font-semibold text-primary mb-3 group-focus-within:text-accent transition-colors duration-300">
                      Inquiry Type *
                    </label>
                    <Select
                      value={formData.inquiryType}
                      onValueChange={(value) => handleInputChange("inquiryType", value)}
                      required
                    >
                      <SelectTrigger className="py-4 border-2 border-secondary focus:ring-primary/20 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 text-darkBrown font-medium shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary text-lg" data-testid="select-inquiry-type">
                        <SelectValue placeholder="Select inquiry type" className="text-primary/60" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-secondary shadow-xl bg-gradient-to-br from-white to-primary/5">
                        <SelectItem value="product-inquiry" className="font-medium text-lg hover:bg-primary/5">Product Inquiry</SelectItem>
                        <SelectItem value="custom-order" className="font-medium text-lg hover:bg-primary/5">Custom Order</SelectItem>
                        <SelectItem value="bulk-order" className="font-medium text-lg hover:bg-primary/5">Bulk Order</SelectItem>
                        <SelectItem value="general-question" className="font-medium text-lg hover:bg-primary/5">General Question</SelectItem>
                        <SelectItem value="complaint" className="font-medium text-lg hover:bg-primary/5">Complaint</SelectItem>
                        <SelectItem value="feedback" className="font-medium text-lg hover:bg-primary/5">Feedback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="group animate-slideInUp" style={{ animationDelay: '1.8s' }}>
                    <label className="block text-lg font-semibold text-primary mb-3 group-focus-within:text-accent transition-colors duration-300">
                      Message *
                    </label>
                    <Textarea
                      rows={5}
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      className="py-4 border-2 border-secondary focus:border-primary focus:ring-primary/20 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 text-darkBrown placeholder-primary/60 font-medium shadow-sm hover:shadow-md transition-all duration-300 resize-none text-lg"
                      placeholder="Tell us about your furniture requirements and how we can help you..."
                      required
                      data-testid="textarea-message"
                    />
                  </div>

                  <div className="animate-slideInUp" style={{ animationDelay: '2s' }}>
                    <Button
                      type="submit"
                      disabled={submitInquiryMutation.isPending}
                      className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white py-6 font-bold text-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 relative overflow-hidden group/btn"
                      data-testid="button-submit-inquiry"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                      <span className="relative z-10 flex items-center justify-center">
                        {submitInquiryMutation.isPending ? (
                          <>
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            Send Inquiry
                            <div className="ml-3 w-6 h-6 bg-white rounded-full flex items-center justify-center group-hover/btn:animate-bounce">
                              <Mail className="h-3 w-3 text-primary" />
                            </div>
                          </>
                        )}
                      </span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-24 animate-slideInUp" style={{ animationDelay: '2.2s' }}>
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-full px-8 py-3 mb-6 shadow-lg animate-slideInDown" style={{ animationDelay: '2.3s' }}>
              <div className="w-4 h-4 bg-gradient-to-r from-primary to-accent rounded-full mr-4 animate-pulse"></div>
              <span className="text-primary font-bold text-lg">Why Choose Us</span>
            </div>
            <h2 className="text-4xl font-display font-bold bg-gradient-to-r from-darkBrown via-primary to-accent bg-clip-text text-transparent mb-4 animate-slideInUp" style={{ animationDelay: '2.4s' }}>Experience Excellence</h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed animate-slideInUp" style={{ animationDelay: '2.5s' }}>Discover what makes IndoSaga Furniture your perfect partner for premium teak furniture</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                icon: Phone,
                title: "Quick Response",
                description: "We respond to all inquiries within 24 hours with detailed information",
                delay: '2.6s',
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: MapPin,
                title: "Free Consultation",
                description: "Visit our showroom for personalized guidance and expert advice",
                delay: '2.8s',
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: Mail,
                title: "Custom Orders",
                description: "Bespoke furniture tailored to your exact needs and specifications",
                delay: '3s',
                color: "from-purple-500 to-pink-500"
              }
            ].map((item, index) => (
              <Card key={index} className="group text-center bg-gradient-to-br from-white via-warmWhite to-primary/5 border-0 shadow-xl hover:shadow-3xl transition-all duration-500 relative overflow-hidden transform hover:scale-105 animate-slideInUp" style={{ animationDelay: item.delay }}>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-500 transform translate-x-6 -translate-y-6"></div>

                <CardContent className="p-10 relative z-10">
                  <div className={`w-20 h-20 bg-gradient-to-br ${item.color} rounded-full mx-auto mb-8 flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-125 group-hover:rotate-12`}>
                    <item.icon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-primary mb-6 group-hover:text-accent transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-lg group-hover:text-gray-700 transition-colors duration-300">
                    {item.description}
                  </p>

                  <div className="mt-8 w-full h-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full overflow-hidden">
                    <div className="w-0 h-full bg-gradient-to-r from-primary to-accent rounded-full group-hover:w-full transition-all duration-1000 ease-out"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
