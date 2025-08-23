import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { AuthType, AuthConfig } from '@/lib/types/auth';

export type { AuthType, AuthConfig };

interface AuthConfigFormProps {
  authType: AuthType;
  authConfig?: AuthConfig | null;
  authRef?: string | null;
  onChange: (authType: AuthType, config: AuthConfig | null, authRef?: string) => void;
}

export function AuthConfigForm({ 
  authType: initialAuthType = 'NONE', 
  authConfig: initialConfig = {}, 
  authRef: initialAuthRef = '',
  onChange 
}: AuthConfigFormProps) {
  const [authType, setAuthType] = useState<AuthType>(initialAuthType);
  const [authRef, setAuthRef] = useState(initialAuthRef || '');
  const [config, setConfig] = useState<AuthConfig>(initialConfig || {});

  // Update parent when values change
  useEffect(() => {
    onChange(authType, authType === 'NONE' ? null : config, authRef);
  }, [authType, config, authRef, onChange]);

  const handleConfigChange = (updates: Partial<AuthConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };
  
  // Handle input changes with proper typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleConfigChange({ [name]: value });
  };
  
  // Handle button clicks for key location
  const handleKeyLocationChange = (location: 'header' | 'query') => {
    handleConfigChange({ keyLocation: location });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="auth-type">Authentication Type</Label>
        <Select 
          value={authType} 
          onValueChange={(value: AuthType) => setAuthType(value)}
        >
          <SelectTrigger id="auth-type">
            <SelectValue placeholder="Select authentication type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">None</SelectItem>
            <SelectItem value="API_KEY">API Key</SelectItem>
            <SelectItem value="BEARER">Bearer Token</SelectItem>
            <SelectItem value="BASIC">Basic Auth</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {authType !== 'NONE' && (
        <div className="space-y-4 pl-4 border-l-2 border-muted">
          {authType === 'API_KEY' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  name="keyName"
                  placeholder="X-API-Key"
                  value={config.keyName || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Key Location</Label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={config.keyLocation === 'header' ? 'default' : 'outline'}
                    onClick={() => handleKeyLocationChange('header')}
                    type="button"
                  >
                    Header
                  </Button>
                  <Button
                    variant={config.keyLocation === 'query' ? 'default' : 'outline'}
                    onClick={() => handleKeyLocationChange('query')}
                    type="button"
                  >
                    Query Parameter
                  </Button>
                </div>
              </div>
            </>
          )}

          {(authType === 'BEARER' || authType === 'BASIC') && (
            <div className="space-y-2">
              <Label htmlFor="token-prefix">Token Prefix</Label>
              <Input
                id="token-prefix"
                name="tokenPrefix"
                placeholder={authType === 'BEARER' ? 'Bearer' : 'Basic'}
                value={config.tokenPrefix || ''}
                onChange={handleInputChange}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="auth-ref">
              {authType === 'API_KEY' ? 'API Key' : 'Token'} Reference
            </Label>
            <div className="flex space-x-2">
              <Input
                id="auth-ref"
                type="password"
                placeholder="Reference to your secret"
                value={authRef}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuthRef(e.target.value)}
              />
              <Button variant="outline" type="button">
                Manage Secrets
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Reference to the secret in your secure storage
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
