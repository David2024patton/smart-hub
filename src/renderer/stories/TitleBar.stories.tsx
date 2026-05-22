import type { Meta, StoryObj, Decorator } from '@storybook/react'
import { TitleBar } from '../components/TitleBar'

const meta: Meta<typeof TitleBar> = {
  title: 'Components/TitleBar',
  component: TitleBar,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof TitleBar>

const Container: Decorator = (Story) => <div style={{ maxWidth: 800 }}><Story /></div>

export const Default: Story = {
  parameters: { layout: 'fullscreen' },
  decorators: [Container],
}
