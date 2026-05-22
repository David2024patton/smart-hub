import type { Meta, StoryObj } from '@storybook/react'
import { DebugOverlay } from '../components/DebugOverlay'

const meta: Meta<typeof DebugOverlay> = {
  title: 'Components/DebugOverlay',
  component: DebugOverlay,
  tags: ['autodocs'],
  argTypes: { activePage: { control: 'text' } },
}
export default meta
type Story = StoryObj<typeof DebugOverlay>

export const Dashboard: Story = {
  args: { activePage: 'dashboard' },
}

export const McpMesh: Story = {
  args: { activePage: 'mcp-grid' },
}
