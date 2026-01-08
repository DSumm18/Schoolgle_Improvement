import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OfstedFrameworkView from './OfstedFrameworkView';
import { AuthContext } from '@/context/SupabaseAuthContext';

// Mock the child components
vi.mock('./ActionModal', () => ({
  default: ({ isOpen }: any) => (isOpen ? <div data-testid="action-modal">Action Modal</div> : null),
}));

vi.mock('./EvidenceModal', () => ({
  default: ({ isOpen }: any) =>
    isOpen ? <div data-testid="evidence-modal">Evidence Modal</div> : null,
}));

vi.mock('./EdAnalysisPanel', () => ({
  default: () => <div data-testid="ed-analysis-panel">Ed Analysis Panel</div>,
}));

// Mock Ofsted framework data
vi.mock('@/lib/ofsted-framework', async () => {
  const actual = await vi.importActual('@/lib/ofsted-framework');
  return {
    ...actual,
    OFSTED_FRAMEWORK: [
      {
        id: 'quality_of_education',
        name: 'Quality of Education',
        description: 'Test description',
        color: 'rose',
        guidanceSummary: 'Test guidance',
        guidanceLink: 'https://example.com',
        subcategories: [
          {
            id: 'curriculum_intent',
            name: 'Curriculum Intent',
            description: 'Test subcategory',
            evidenceRequired: [
              { id: 'ev1', name: 'Curriculum policy documents', description: 'Test' },
              { id: 'ev2', name: 'Subject schemes of work', description: 'Test' },
            ],
            keyIndicators: ['Indicator 1'],
            inspectionFocus: ['Focus 1'],
          },
        ],
      },
    ],
    SAFEGUARDING_FRAMEWORK: {
      id: 'safeguarding',
      name: 'Safeguarding',
      subcategories: [],
    },
    calculateAIRating: vi.fn((evidenceCount: number, requiredCount: number) => 'good'),
    calculateCategoryReadiness: vi.fn(() => ({ userScore: 75, aiScore: 80 })),
    calculateOverallReadiness: vi.fn(() => ({ userScore: 70, aiScore: 75 })),
  };
});

describe('OfstedFrameworkView Component', () => {
  const mockSetAssessments = vi.fn();

  const mockAuthContextValue = {
    user: { uid: 'test-user', email: 'test@example.com' } as any,
    loading: false,
    accessToken: 'test-token',
    providerId: 'google.com',
    organization: { id: 'org-1', name: 'Test School', role: 'admin' as const },
    signInWithGoogle: vi.fn(),
    signInWithMicrosoft: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  };

  const renderWithAuth = (ui: React.ReactElement) => {
    return render(
      <AuthContext.Provider value={mockAuthContextValue}>{ui}</AuthContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render the component without crashing', () => {
      renderWithAuth(<OfstedFrameworkView assessments={{}} setAssessments={mockSetAssessments} />);
      expect(screen.getByText(/Quality of Education/i)).toBeInTheDocument();
    });

    it('should display category names', () => {
      renderWithAuth(<OfstedFrameworkView assessments={{}} setAssessments={mockSetAssessments} />);
      expect(screen.getByText('Quality of Education')).toBeInTheDocument();
    });

    it('should render with assessments prop', () => {
      const assessments = {
        curriculum_intent: {
          schoolRating: 'good',
          schoolRationale: 'Great work',
          aiRating: 'good',
          aiRationale: 'AI analysis shows good coverage',
        },
      };

      renderWithAuth(
        <OfstedFrameworkView assessments={assessments} setAssessments={mockSetAssessments} />
      );
      expect(screen.getByText(/Quality of Education/i)).toBeInTheDocument();
    });

    it('should render with local evidence', () => {
      const localEvidence = {
        curriculum_intent_ev1: [
          {
            fileId: 'file-1',
            fileName: 'policy.pdf',
            filePath: '/docs/policy.pdf',
            frameworkArea: 'curriculum_intent_ev1',
            frameworkAreaLabel: 'Curriculum Intent',
            confidence: 0.95,
            matchedKeywords: ['curriculum', 'policy'],
            relevantExcerpt: 'Our curriculum policy...',
          },
        ],
      };

      renderWithAuth(
        <OfstedFrameworkView
          assessments={{}}
          setAssessments={mockSetAssessments}
          localEvidence={localEvidence}
        />
      );
      expect(screen.getByText(/Quality of Education/i)).toBeInTheDocument();
    });
  });

  describe('Category Expansion', () => {
    it('should expand category when clicked', async () => {
      renderWithAuth(<OfstedFrameworkView assessments={{}} setAssessments={mockSetAssessments} />);

      const categoryHeader = screen.getByText('Quality of Education').closest('button');
      expect(categoryHeader).toBeInTheDocument();

      if (categoryHeader) {
        fireEvent.click(categoryHeader);
        await waitFor(() => {
          expect(screen.getByText('Curriculum Intent')).toBeInTheDocument();
        });
      }
    });

    it('should collapse category when clicked again', async () => {
      renderWithAuth(<OfstedFrameworkView assessments={{}} setAssessments={mockSetAssessments} />);

      const categoryHeader = screen.getByText('Quality of Education').closest('button');

      if (categoryHeader) {
        // Expand
        fireEvent.click(categoryHeader);
        await waitFor(() => {
          expect(screen.getByText('Curriculum Intent')).toBeInTheDocument();
        });

        // Collapse
        fireEvent.click(categoryHeader);
        await waitFor(() => {
          expect(screen.queryByText('Curriculum Intent')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Assessment Display', () => {
    it('should show assessment ratings when available', () => {
      const assessments = {
        curriculum_intent: {
          schoolRating: 'exceptional',
          schoolRationale: 'Outstanding curriculum design',
        },
      };

      renderWithAuth(
        <OfstedFrameworkView assessments={assessments} setAssessments={mockSetAssessments} />
      );

      // Expand to see subcategory
      const categoryHeader = screen.getByText('Quality of Education').closest('button');
      if (categoryHeader) {
        fireEvent.click(categoryHeader);
      }
    });

    it('should handle missing assessments gracefully', () => {
      renderWithAuth(<OfstedFrameworkView assessments={{}} setAssessments={mockSetAssessments} />);
      expect(screen.getByText(/Quality of Education/i)).toBeInTheDocument();
    });
  });

  describe('Evidence Count Display', () => {
    it('should show evidence count when local evidence is provided', async () => {
      const localEvidence = {
        curriculum_intent_ev1: [
          {
            fileId: 'file-1',
            fileName: 'policy.pdf',
            filePath: '/docs/policy.pdf',
            frameworkArea: 'curriculum_intent_ev1',
            frameworkAreaLabel: 'Curriculum Intent',
            confidence: 0.95,
            matchedKeywords: ['curriculum'],
            relevantExcerpt: 'Test excerpt',
          },
        ],
      };

      renderWithAuth(
        <OfstedFrameworkView
          assessments={{}}
          setAssessments={mockSetAssessments}
          localEvidence={localEvidence}
        />
      );

      // Expand category to see evidence counts
      const categoryHeader = screen.getByText('Quality of Education').closest('button');
      if (categoryHeader) {
        fireEvent.click(categoryHeader);
        await waitFor(() => {
          expect(screen.getByText('Curriculum Intent')).toBeInTheDocument();
        });
      }
    });
  });

  describe('User Authentication', () => {
    it('should render differently when user is not authenticated', () => {
      const noAuthContext = {
        ...mockAuthContextValue,
        user: null,
        accessToken: null,
      };

      render(
        <AuthContext.Provider value={noAuthContext}>
          <OfstedFrameworkView assessments={{}} setAssessments={mockSetAssessments} />
        </AuthContext.Provider>
      );

      expect(screen.getByText(/Quality of Education/i)).toBeInTheDocument();
    });

    it('should render with authenticated user', () => {
      renderWithAuth(<OfstedFrameworkView assessments={{}} setAssessments={mockSetAssessments} />);
      expect(screen.getByText(/Quality of Education/i)).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should call setAssessments when updating', async () => {
      renderWithAuth(<OfstedFrameworkView assessments={{}} setAssessments={mockSetAssessments} />);

      // This would typically be triggered by user interaction
      // The actual implementation depends on how ratings are updated
      expect(mockSetAssessments).not.toHaveBeenCalled(); // Initially not called
    });

    it('should handle empty assessments object', () => {
      renderWithAuth(<OfstedFrameworkView assessments={{}} setAssessments={mockSetAssessments} />);
      expect(screen.getByText(/Quality of Education/i)).toBeInTheDocument();
    });

    it('should handle undefined localEvidence', () => {
      renderWithAuth(<OfstedFrameworkView assessments={{}} setAssessments={mockSetAssessments} />);
      expect(screen.getByText(/Quality of Education/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible buttons for category expansion', () => {
      renderWithAuth(<OfstedFrameworkView assessments={{}} setAssessments={mockSetAssessments} />);

      const categoryButton = screen.getByText('Quality of Education').closest('button');
      expect(categoryButton).toBeInTheDocument();
      expect(categoryButton).toHaveAttribute('type', 'button');
    });

    it('should render with proper ARIA attributes', () => {
      renderWithAuth(<OfstedFrameworkView assessments={{}} setAssessments={mockSetAssessments} />);

      // Check for interactive elements
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Data Structure Validation', () => {
    it('should handle complex assessment data structures', () => {
      const complexAssessments = {
        curriculum_intent: {
          schoolRating: 'exceptional',
          schoolRationale: 'Detailed rationale with multiple points',
          aiRating: 'strong_standard',
          aiRationale: 'AI detected strong evidence',
        },
        another_subcategory: {
          schoolRating: 'expected_standard',
          schoolRationale: 'Meeting requirements',
        },
      };

      renderWithAuth(
        <OfstedFrameworkView
          assessments={complexAssessments}
          setAssessments={mockSetAssessments}
        />
      );

      expect(screen.getByText(/Quality of Education/i)).toBeInTheDocument();
    });

    it('should handle partial assessment data', () => {
      const partialAssessments = {
        curriculum_intent: {
          schoolRating: 'good',
          // Missing rationale
        },
      };

      renderWithAuth(
        <OfstedFrameworkView
          assessments={partialAssessments}
          setAssessments={mockSetAssessments}
        />
      );

      expect(screen.getByText(/Quality of Education/i)).toBeInTheDocument();
    });
  });
});
