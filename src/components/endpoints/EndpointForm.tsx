import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AuthConfigForm, type AuthType } from './auth/AuthConfigForm';

const endpointFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  description: z.string().optional(),
  provider: z.string().min(1, {
    message: 'Provider is required',
  }),
  baseUrlTemplate: z.string().url({
    message: 'Please enter a valid URL',
  }),
  authType: z.enum(['NONE', 'BASIC', 'BEARER', 'API_KEY']).default('NONE'),
  authConfig: z.record(z.any()).optional().nullable(),
  authRef: z.string().optional().nullable(),
});

type EndpointFormValues = z.infer<typeof endpointFormSchema>;

interface EndpointFormProps {
  defaultValues?: Partial<EndpointFormValues>;
  onSubmit: (values: EndpointFormValues) => void;
  isLoading?: boolean;
  submitButtonText?: string;
}

export function EndpointForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitButtonText = 'Create Endpoint',
}: EndpointFormProps) {
  const [authType, setAuthType] = useState<AuthType>(defaultValues?.authType as AuthType || 'NONE');
  const [authConfig, setAuthConfig] = useState(defaultValues?.authConfig || null);
  const [authRef, setAuthRef] = useState(defaultValues?.authRef || '');

  const form = useForm<EndpointFormValues>({
    resolver: zodResolver(endpointFormSchema),
    defaultValues: {
      name: '',
      description: '',
      provider: '',
      baseUrlTemplate: '',
      authType: 'NONE',
      authConfig: null,
      authRef: '',
      ...defaultValues,
    },
  });

  // Handle form submission
  const handleSubmit = (values: EndpointFormValues) => {
    // Merge the form values with the current auth state
    const formData = {
      ...values,
      authType,
      authConfig: authType === 'NONE' ? null : authConfig,
      authRef: authType === 'NONE' ? null : authRef,
    };
    
    onSubmit(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Endpoint Details</CardTitle>
            <CardDescription>
              Configure the basic details of your API endpoint.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My API Endpoint" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A brief description of this endpoint"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., OpenAI, Stripe, GitHub" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="baseUrlTemplate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://api.example.com/v1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              Configure how to authenticate with this API.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthConfigForm
              authType={authType}
              authConfig={authConfig}
              authRef={authRef}
              onChange={(type, config, ref) => {
                setAuthType(type);
                if (config) setAuthConfig(config);
                if (ref) setAuthRef(ref);
              }}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );
}
