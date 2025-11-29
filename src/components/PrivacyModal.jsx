import React, { useState } from 'react';
import { Shield, Lock, Wifi, Download, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

export const PrivacyModal = ({ isOpen, onClose, onClearAllData, onExportData }) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const privacyPoints = [
    {
      icon: Lock,
      title: "Voice never leaves your device",
      description: "All speech recognition happens locally in your browser. Your voice audio is never uploaded or stored.",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: Shield,
      title: "Only processed text is stored locally",
      description: "We only save the extracted transaction details (amount, merchant, category) in your browser's local storage.",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Wifi,
      title: "Webhook sync is optional",
      description: "You control whether to sync data to external services. If configured, only transaction details are sent—never voice data.",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: Download,
      title: "Export or delete all data anytime",
      description: "Your data belongs to you. Export it as JSON or delete everything with one click—no questions asked.",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  const handleClearAll = () => {
    onClearAllData();
    setShowClearConfirm(false);
    onClose();
  };

  const handleExport = () => {
    onExportData();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-6 h-6 text-green-600" />
            Data & Privacy
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Privacy Statements */}
          <div className="space-y-4">
            {privacyPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <Card key={index} className="border-l-4 border-gray-200 hover:border-green-500 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 ${point.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${point.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                          {point.title}
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {point.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Data Management Actions */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">
              Data Management
            </h3>

            <div className="space-y-3">
              {/* Export Data */}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleExport}
              >
                <Download className="w-4 h-4 mr-2" />
                Export All Data (JSON)
              </Button>

              {/* Clear All Data */}
              {!showClearConfirm ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setShowClearConfirm(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Data
                </Button>
              ) : (
                <Card className="border-2 border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-900 text-sm mb-1">
                          Are you sure?
                        </p>
                        <p className="text-xs text-red-700">
                          This will permanently delete all transactions, settings, and merchant corrections. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        onClick={handleClearAll}
                      >
                        Yes, Delete Everything
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowClearConfirm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-gray-700">100% local-first:</strong> SpendVoice is built with privacy in mind.
                All core functionality works offline, and your data never leaves your device unless you explicitly enable webhook sync.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
