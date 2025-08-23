import type { Meta, StoryObj } from '@storybook/react';
import { EndpointForm } from './EndpointForm';

const meta = {
  title: 'Components/Endpoints/EndpointForm',
  component: EndpointForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EndpointForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateNew: Story = {
  args: {
    submitButtonText: 'Create Endpoint',
    onSubmit: (values) => {
      console.log('Form submitted with values:', values);
    },
  },
};

export const EditExisting: Story = {
  args: {
    defaultValues: {
      name: 'Stripe API',
      description: 'Payment processing API',
      provider: 'Stripe',
      baseUrlTemplate: 'https://api.stripe.com/v1',
      authType: 'API_KEY',
      authConfig: {
        keyName: 'Authorization',
        keyLocation: 'header',
      },
      authRef: 'stripe-api-key-123',
    },
    submitButtonText: 'Save Changes',
    onSubmit: (values) => {
      console.log('Form submitted with values:', values);
    },
  },
};

export const WithBasicAuth: Story = {
  args: {
    defaultValues: {
      name: 'GitHub API',
      description: 'GitHub REST API',
      provider: 'GitHub',
      baseUrlTemplate: 'https://api.github.com',
      authType: 'BASIC',
      authConfig: {
        tokenPrefix: 'Basic',
      },
      authRef: 'github-token-456',
    },
    submitButtonText: 'Save Changes',
    onSubmit: (values) => {
      console.log('Form submitted with values:', values);
    },
  },
};
