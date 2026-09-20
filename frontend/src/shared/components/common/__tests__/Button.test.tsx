import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { Button } from '../Button';

describe('Button', () => {
    /* Rendering */
    it('renders children', () => {
        render(<Button>Click me</Button>);
        expect(
            screen.getByRole('button', { name: 'Click me' })
        ).toBeInTheDocument();
    });

    it('renders as a <button> element', () => {
        render(<Button>Submit</Button>);
        expect(screen.getByRole('button')).toBeInstanceOf(HTMLButtonElement);
    });

    /* Variants */
    it('applies btn-primary class by default', () => {
        render(<Button>Primary</Button>);
        expect(screen.getByRole('button')).toHaveClass('btn-primary');
    });

    it('applies btn-danger class for danger variant', () => {
        render(<Button variant="danger">Delete</Button>);
        expect(screen.getByRole('button')).toHaveClass('btn-danger');
    });

    it('applies btn-success class for success variant', () => {
        render(<Button variant="success">Save</Button>);
        expect(screen.getByRole('button')).toHaveClass('btn-success');
    });

    it('applies btn-outline-primary class for outline variant', () => {
        render(<Button variant="outline">Outline</Button>);
        expect(screen.getByRole('button')).toHaveClass('btn-outline-primary');
    });

    it('applies btn-secondary class for secondary variant', () => {
        render(<Button variant="secondary">Secondary</Button>);
        expect(screen.getByRole('button')).toHaveClass('btn-secondary');
    });

    /* Sizes */
    it('applies btn-sm for sm size', () => {
        render(<Button size="sm">Small</Button>);
        expect(screen.getByRole('button')).toHaveClass('btn-sm');
    });

    it('applies btn-lg for lg size', () => {
        render(<Button size="lg">Large</Button>);
        expect(screen.getByRole('button')).toHaveClass('btn-lg');
    });

    /* fullWidth */
    it('adds w-100 when fullWidth=true', () => {
        render(<Button fullWidth>Full</Button>);
        expect(screen.getByRole('button')).toHaveClass('w-100');
    });

    it('does not add w-100 by default', () => {
        render(<Button>Normal</Button>);
        expect(screen.getByRole('button')).not.toHaveClass('w-100');
    });

    /* Disabled */
    it('is disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not fire onClick when disabled', async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();
        render(
            <Button disabled onClick={handleClick}>
                Disabled
            </Button>
        );
        await user.click(screen.getByRole('button'));
        expect(handleClick).not.toHaveBeenCalled();
    });

    /* isLoading */
    it('disables the button while loading', () => {
        render(<Button isLoading>Save</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows default children text while loading when no loadingText', () => {
        render(<Button isLoading>Save</Button>);
        // The children text is still shown next to the spinner
        expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('shows loadingText instead of children when provided', () => {
        render(
            <Button isLoading loadingText="Saving...">
                Save
            </Button>
        );
        expect(screen.getByText('Saving...')).toBeInTheDocument();
        expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });

    /* Icons */
    it('renders leftIcon when provided', () => {
        render(<Button leftIcon={<span data-testid="left-icon" />}>Go</Button>);
        expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders rightIcon when provided', () => {
        render(
            <Button rightIcon={<span data-testid="right-icon" />}>Go</Button>
        );
        expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('does not render icon wrappers when no icons provided', () => {
        const { container } = render(<Button>No Icons</Button>);
        // No extra <span> wrappers for icons
        expect(
            container.querySelectorAll('span.tw\\:inline-flex')
        ).toHaveLength(0);
    });

    /* onClick */
    it('calls onClick when clicked', async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click</Button>);
        await user.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    /* className merge */
    it('merges custom className with base classes', () => {
        render(<Button className="extra-class">Styled</Button>);
        const btn = screen.getByRole('button');
        expect(btn).toHaveClass('btn');
        expect(btn).toHaveClass('extra-class');
    });

    /* forwardRef */
    it('forwards ref to the underlying button element', () => {
        const ref = createRef<HTMLButtonElement>();
        render(<Button ref={ref}>Ref button</Button>);
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
        expect(ref.current?.textContent).toBe('Ref button');
    });
});
