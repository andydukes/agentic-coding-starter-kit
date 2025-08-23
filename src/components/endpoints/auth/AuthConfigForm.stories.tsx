import type { Meta, StoryObj } from '@storybook/react';
import { AuthConfigForm } from './AuthConfigForm';
import type { AuthType, AuthConfig } from '@/lib/types/auth';

// Mock the onChange handler
const handleChange = (type: AuthType, config: AuthConfig | null, authRef?: string) => {
  console.log('Auth type:', type);
  console.log('Config:', config);
  console.log('Auth ref:', authRef);
};

const meta: Meta<typeof AuthConfigForm> = {
  title: 'Components/Endpoints/AuthConfigForm',
  component: AuthConfigForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof AuthConfigForm>;

export const NoAuth: Story = {
  args: {
    authType: 'NONE',
    onChange: handleChange,
  },
};

export const WithApiKey: Story = {
  args: {
    authType: 'API_KEY',
    authConfig: {
      keyName: 'X-API-Key',
      keyLocation: 'header',
    },
    authRef: 'api-key-ref-123',
    onChange: handleChange,
  },
};

export const WithBearerToken: Story = {
  args: {
    authType: 'BEARER',
    authConfig: {
      tokenPrefix: 'Bearer',
    },
    authRef: 'bearer-token-123',
    onChange: handleChange,
  },
};

export const WithBasicAuth: Story = {
  args: {
    authType: 'BASIC',
    authConfig: {
      tokenPrefix: 'Basic',
    },
    authRef: 'basic-auth-123',
    onChange: handleChange,
  },
};
