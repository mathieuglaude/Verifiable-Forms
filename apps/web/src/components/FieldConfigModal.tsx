import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface FieldConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: any) => void;
  initialConfig?: any;
}

export default function FieldConfigModal({ isOpen, onClose, onSave, initialConfig }: FieldConfigModalProps) {
  const [config, setConfig] = useState({
    label: '',
    placeholder: '',
    description: '',
    required: false,
    dataSource: 'freetext',
    credentialMode: 'optional', // 'optional' | 'required'
    options: '',
    credentialType: '',
    attributeName: ''
  });

  const { data: credentialTemplates } = useQuery({
    queryKey: ['/api/cred-lib'],
    queryFn: async () => {
      const response = await fetch('/api/cred-lib');
      if (!response.ok) throw new Error('Failed to fetch credentials');
      return response.json();
    },
    enabled: isOpen
  });

  // Get selected credential template ID
  const selectedTemplateId = credentialTemplates?.find((t: any) => t.label === config.credentialType)?.id;

  // Fetch credential attributes for the selected template
  const { data: attrs, isLoading: attrsLoading } = useQuery({
    queryKey: ['cred-attrs', selectedTemplateId],
    queryFn: async () => {
      const response = await fetch(`/api/cred-lib/${selectedTemplateId}`);
      if (!response.ok) throw new Error('Failed to fetch credential template');
      const template = await response.json();
      return template.attributes || [];
    },
    enabled: Boolean(selectedTemplateId)
  });

  useEffect(() => {
    if (initialConfig && isOpen) {
      setConfig({
        label: initialConfig.label || '',
        placeholder: initialConfig.placeholder || '',
        description: initialConfig.description || '',
        required: initialConfig.validate?.required || false,
        dataSource: initialConfig.properties?.dataSource || 'freetext',
        credentialMode: initialConfig.properties?.credentialMode || 'optional',
        options: initialConfig.properties?.options?.join('\n') || '',
        credentialType: initialConfig.properties?.vcMapping?.credentialType || '',
        attributeName: initialConfig.properties?.vcMapping?.attributeName || ''
      });
    } else if (isOpen) {
      setConfig({
        label: '',
        placeholder: '',
        description: '',
        required: false,
        dataSource: 'freetext',
        credentialMode: 'optional',

        options: '',
        credentialType: '',
        attributeName: ''
      });
    }
  }, [initialConfig, isOpen]);

  // Reset attribute mapping when credential template changes
  useEffect(() => {
    setConfig(prev => ({ ...prev, attributeName: '' }));
  }, [selectedTemplateId]);

  const handleSave = () => {
    const fieldConfig = {
      label: config.label,
      placeholder: config.placeholder,
      description: config.description,
      validate: {
        required: config.required
      },
      properties: {
        dataSource: config.dataSource,
        ...(config.dataSource === 'verified' && {
          credentialMode: config.credentialMode
        }),
        ...(config.dataSource === 'picklist' && {
          options: config.options.split('\n').filter(opt => opt.trim())
        }),
        ...(config.dataSource === 'verified' && {
          vcMapping: {
            credentialType: config.credentialType,
            attributeName: config.attributeName
          }
        })
      }
    };

    onSave(fieldConfig);
  };

  const getCredentialAttributes = () => {
    if (!attrs || attrsLoading) return [];
    return attrs;
  };

  const getCredentialTypes = () => {
    if (!credentialTemplates || !Array.isArray(credentialTemplates)) return [];
    
    try {
      return credentialTemplates.map((template: any) => ({
        value: template.label,
        label: template.label
      }));
    } catch (error) {
      console.error('Error getting credential types:', error);
      return [];
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Field Configuration</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Properties */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Properties</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="label">Field Label</Label>
                <Input
                  id="label"
                  value={config.label}
                  onChange={(e) => setConfig({ ...config, label: e.target.value })}
                  placeholder="Enter field label"
                />
              </div>
              <div>
                <Label htmlFor="placeholder">Placeholder Text</Label>
                <Input
                  id="placeholder"
                  value={config.placeholder}
                  onChange={(e) => setConfig({ ...config, placeholder: e.target.value })}
                  placeholder="Enter placeholder text"
                />
              </div>
              <div>
                <Label htmlFor="description">Help Text</Label>
                <Input
                  id="description"
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  placeholder="Enter help text"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="required"
                  checked={config.required}
                  onCheckedChange={(checked) => setConfig({ ...config, required: !!checked })}
                />
                <Label htmlFor="required">Required field</Label>
              </div>
            </div>
          </div>

          {/* Data Source Configuration */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Data Source Type</h4>
            <Select value={config.dataSource} onValueChange={(value) => setConfig({ ...config, dataSource: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="freetext">Free Text Only - User enters value manually</SelectItem>
                <SelectItem value="picklist">Pick List - User selects from predefined options</SelectItem>
                <SelectItem value="verified">Verifiable Credential - Auto-filled or manual entry</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Credential Mode Configuration */}
          {config.dataSource === 'verified' && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Credential Verification Mode</h4>
              <Select value={config.credentialMode} onValueChange={(value) => setConfig({ ...config, credentialMode: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="optional">Optional - User can present credential OR type manually</SelectItem>
                  <SelectItem value="required">Required - User must present valid credential</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-2">
                {config.credentialMode === 'optional' 
                  ? "Users can choose to verify with a credential or fill manually. Field will auto-populate if credential is presented."
                  : "Users must present a valid credential to proceed. Manual entry is not allowed for this field."
                }
              </p>
            </div>
          )}

          {/* Pick List Configuration */}
          {config.dataSource === 'picklist' && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h5 className="text-sm font-medium text-gray-800 mb-3">Pick List Options</h5>
              <div>
                <Label htmlFor="options">Options (one per line)</Label>
                <Textarea
                  id="options"
                  rows={4}
                  value={config.options}
                  onChange={(e) => setConfig({ ...config, options: e.target.value })}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                />
              </div>
            </div>
          )}

          {/* Verified Attribute Configuration */}
          {config.dataSource === 'verified' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h5 className="text-sm font-medium text-green-800 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Verified Attribute Configuration
              </h5>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="credentialType">Select from Credential Catalogue</Label>
                  <Select value={config.credentialType} onValueChange={(value) => setConfig({ ...config, credentialType: value, attributeName: '' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a credential from your catalogue..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getCredentialTypes().map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{type.label}</span>
                            <span className="text-xs text-gray-500">
                              {type.value === 'BC Person Credential' && 'BC Government issued identity credential'}
                              {type.value === 'BC Digital Business Card' && 'BC Government business registration credential'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {config.credentialType && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Selected: {config.credentialType}
                    </p>
                  )}
                </div>
                
                {config.credentialType && (
                  <div>
                    <Label htmlFor="attributeName">Map to Attribute</Label>
                    <Select 
                      value={config.attributeName} 
                      onValueChange={(value) => setConfig({ ...config, attributeName: value })}
                      disabled={attrsLoading || !config.credentialType}
                    >
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            attrsLoading 
                              ? "Loading attributes..." 
                              : !config.credentialType 
                                ? "Select a credential type first"
                                : getCredentialAttributes().length === 0
                                  ? "No attributes found"
                                  : "Select which attribute to map to this field..."
                          } 
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {getCredentialAttributes().map((attr: any) => {
                          const attrName = typeof attr === 'string' ? attr : attr.name;
                          const attrDesc = typeof attr === 'string' ? attr : attr.description;
                          return (
                            <SelectItem key={attrName} value={attrName}>
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{attrDesc || attrName}</span>
                                <span className="text-xs text-gray-400">Field: {attrName}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                        {getCredentialAttributes().length === 0 && (
                          <div className="p-2 text-sm text-gray-500">
                            No attributes available for this credential type
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {config.attributeName && (
                      <p className="text-xs text-blue-600 mt-1">
                        This form field will be auto-populated with the "{config.attributeName}" attribute from the credential
                      </p>
                    )}
                  </div>
                )}


              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}