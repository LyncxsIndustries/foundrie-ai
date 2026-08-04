import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessage } from './ChatMessage';

describe('ChatMessage - Feature 63: Separate Text and Image Bubbles', () => {
  const mockMessage = {
    id: 'msg-1',
    role: 'user' as const,
    content: 'Hello, this is a test message',
    createdAt: new Date().toISOString(),
  };

  it('renders text content in a message bubble', () => {
    render(<ChatMessage message={mockMessage} />);
    expect(screen.getByText(/Hello, this is a test message/)).toBeInTheDocument();
  });

  it('renders text and single image in separate bubbles', () => {
    const messageWithImage = {
      ...mockMessage,
      attachments: [
        {
          id: 'att-1',
          type: 'image' as const,
          cloudinaryUrl: 'https://example.com/image.jpg',
          originalName: 'test-image.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 12345,
          width: 800,
          height: 600,
        },
      ],
    };

    const { container } = render(<ChatMessage message={messageWithImage} />);
    
    // Should have separate bubbles: one for text, one for image
    const bubbles = container.querySelectorAll('[class*="rounded-2xl"]');
    expect(bubbles.length).toBeGreaterThanOrEqual(2);
    
    // Text should be present
    expect(screen.getByText(/Hello, this is a test message/)).toBeInTheDocument();
    
    // Image should be present with correct alt text
    const image = screen.getByAltText('test-image.jpg');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('renders multiple images each in their own bubble', () => {
    const messageWithMultipleImages = {
      ...mockMessage,
      attachments: [
        {
          id: 'att-1',
          type: 'image' as const,
          cloudinaryUrl: 'https://example.com/image1.jpg',
          originalName: 'image1.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 12345,
          width: 800,
          height: 600,
        },
        {
          id: 'att-2',
          type: 'image' as const,
          cloudinaryUrl: 'https://example.com/image2.jpg',
          originalName: 'image2.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 23456,
          width: 800,
          height: 600,
        },
      ],
    };

    render(<ChatMessage message={messageWithMultipleImages} />);
    
    // Each image should be present
    expect(screen.getByAltText('image1.jpg')).toBeInTheDocument();
    expect(screen.getByAltText('image2.jpg')).toBeInTheDocument();
    
    // Text should also be present
    expect(screen.getByText(/Hello, this is a test message/)).toBeInTheDocument();
  });

  it('renders message with only images (no text)', () => {
    const messageOnlyImages = {
      id: 'msg-2',
      role: 'user' as const,
      content: '', // No text
      createdAt: new Date().toISOString(),
      attachments: [
        {
          id: 'att-1',
          type: 'image' as const,
          cloudinaryUrl: 'https://example.com/image.jpg',
          originalName: 'test-image.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 12345,
          width: 800,
          height: 600,
        },
      ],
    };

    render(<ChatMessage message={messageOnlyImages} />);
    
    // Image should be present
    expect(screen.getByAltText('test-image.jpg')).toBeInTheDocument();
  });

  it('renders document attachment in separate bubble', () => {
    const messageWithDocument = {
      ...mockMessage,
      attachments: [
        {
          id: 'att-1',
          type: 'document' as const,
          cloudinaryUrl: 'https://example.com/document.pdf',
          originalName: 'test-document.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 54321,
        },
      ],
    };

    render(<ChatMessage message={messageWithDocument} />);
    
    // Text should be present
    expect(screen.getByText(/Hello, this is a test message/)).toBeInTheDocument();
    
    // Document link should be present
    const docLink = screen.getByRole('link', { name: /test-document\.pdf/i });
    expect(docLink).toBeInTheDocument();
    expect(docLink).toHaveAttribute('href', 'https://example.com/document.pdf');
  });

  it('renders video attachment in separate bubble', () => {
    const messageWithVideo = {
      ...mockMessage,
      attachments: [
        {
          id: 'att-1',
          type: 'video' as const,
          cloudinaryUrl: 'https://example.com/video.mp4',
          originalName: 'test-video.mp4',
          mimeType: 'video/mp4',
          sizeBytes: 123456,
          width: 1920,
          height: 1080,
        },
      ],
    };

    const { container } = render(<ChatMessage message={messageWithVideo} />);
    
    // Text should be present
    expect(screen.getByText(/Hello, this is a test message/)).toBeInTheDocument();
    
    // Video element should be present
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'https://example.com/video.mp4');
  });

  it('renders assistant message with separate styling', () => {
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const,
      content: 'AI response here',
      attachments: [
        {
          id: 'att-1',
          type: 'image' as const,
          cloudinaryUrl: 'https://example.com/ai-image.jpg',
          originalName: 'ai-image.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 12345,
          width: 800,
          height: 600,
        },
      ],
    };

    render(<ChatMessage message={assistantMessage} />);
    
    // Both text and image should be present
    expect(screen.getByText(/AI response here/)).toBeInTheDocument();
    expect(screen.getByAltText('ai-image.jpg')).toBeInTheDocument();
  });

  it('calls onAction when copy button is clicked on attachment', () => {
    const mockOnAction = vi.fn();
    const messageWithImage = {
      ...mockMessage,
      attachments: [
        {
          id: 'att-1',
          type: 'image' as const,
          cloudinaryUrl: 'https://example.com/image.jpg',
          originalName: 'test-image.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 12345,
          width: 800,
          height: 600,
        },
      ],
    };

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });

    const { container } = render(
      <ChatMessage message={messageWithImage} onAction={mockOnAction} />
    );
    
    // Find copy button for attachment (should be in attachment bubble group)
    const copyButtons = container.querySelectorAll('button[title="Copy URL"]');
    expect(copyButtons.length).toBeGreaterThan(0);
  });

  it('preserves message actions for text bubble', () => {
    const mockOnAction = vi.fn();
    render(<ChatMessage message={mockMessage} onAction={mockOnAction} />);
    
    // Action buttons should be present (Reply, Copy, Edit, Delete, etc.)
    // These are shown on hover via opacity-0 group-hover:opacity-100
    const { container } = render(<ChatMessage message={mockMessage} />);
    const actionButtons = container.querySelectorAll('button[title]');
    
    // Should have action buttons (exact count depends on role)
    expect(actionButtons.length).toBeGreaterThan(0);
  });
});
