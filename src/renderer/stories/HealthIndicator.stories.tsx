import type { Meta, StoryObj } from '@storybook/react'
import { HealthIndicator } from '../components/HealthIndicator'

const meta: Meta<typeof HealthIndicator> = {
  title: 'Components/HealthIndicator',
  component: HealthIndicator,
  tags: ['autodocs'],
  argTypes: {
    status: { control: 'select', options: ['healthy', 'degraded', 'error'] },
    isLoading: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof HealthIndicator>

export const Healthy: Story = {
  args: { status: 'healthy', isLoading: false, error: null, dbConnected: true },
}

export const Degraded: Story = {
  args: { status: 'degraded', isLoading: false, error: null, dbConnected: false },
}

export const Error: Story = {
  args: { status: 'error', isLoading: false, error: 'Connection refused', dbConnected: false },
}

export const Loading: Story = {
  args: { status: 'healthy', isLoading: true, error: null, dbConnected: false },
}
