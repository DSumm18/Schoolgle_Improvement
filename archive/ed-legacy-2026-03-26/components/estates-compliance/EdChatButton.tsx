'use client';

/**
 * EdChatButton Component
 *
 * Button that opens Ed chatbot with pre-loaded task context.
 * Used in the Estates Compliance dashboard to get contextual help.
 */

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export interface EdChatButtonProps {
  /** The check ID (e.g., 'fire_weekly_alarm_test') */
  checkId: string;
  /** Human-readable check name */
  checkName: string;
  /** Compliance domain (e.g., 'fire', 'legionella') */
  domain: string;
  /** Current status of the task */
  status?: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'skipped' | 'not_applicable';
  /** Optional custom button text */
  label?: string;
  /** Button variant */
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  /** Button size */
  size?: 'default' | 'sm' | 'xs';
  /** Show icon only */
  iconOnly?: boolean;
}

/**
 * Open Ed chat with context
 * This communicates with the Ed widget via custom event
 */
function openEdWithContext(context: {
  page: string;
  domain: string;
  checkId: string;
  checkName: string;
  taskStatus?: string;
  initialMessage?: string;
}) {
  // Dispatch custom event that Ed widget will listen to
  const event = new CustomEvent('ed-open-with-context', {
    detail: context,
  });
  window.dispatchEvent(event);

  // Also try to open the widget directly via global instance
  if ((window as any).__ED_INSTANCE__) {
    const ed = (window as any).__ED_INSTANCE__;
    if (ed.open) {
      ed.open();
    }
    // Set tool context for domain-specific help
    if (ed.setToolContext) {
      const domainNames: Record<string, string> = {
        legionella: 'Legionella Control',
        fire: 'Fire Safety',
        asbestos: 'Asbestos Management',
        electrical: 'Electrical Safety',
        gas: 'Gas Safety',
        water: 'Water Quality',
        mechanical: 'Mechanical & Heating',
        lifts: 'Lifts & LOLER',
        playground: 'Playground Safety',
        accessibility: 'Accessibility',
        security: 'Security',
        manual_handling: 'Manual Handling',
        working_at_height: 'Working at Height',
      };

      ed.setToolContext({
        name: context.checkName,
        category: 'Estates',
        expertise: [
          `Statutory compliance for ${domainNames[context.domain] || context.domain}`,
          'Risk assessment guidance',
          'Evidence requirements',
          'HSE regulations',
        ],
      });
    }
  }
}

export function EdChatButton({
  checkId,
  checkName,
  domain,
  status,
  label = 'Ask Ed',
  variant = 'ghost',
  size = 'sm',
  iconOnly = false,
}: EdChatButtonProps) {
  const [isOpening, setIsOpening] = useState(false);

  const handleClick = () => {
    setIsOpening(true);

    // Build context for Ed
    const context = {
      page: 'estates-compliance',
      domain,
      checkId,
      checkName,
      taskStatus: status,
      initialMessage: buildInitialMessage(checkName, domain, status),
    };

    // Open Ed with context
    openEdWithContext(context);

    // Reset loading state after a brief delay
    setTimeout(() => setIsOpening(false), 500);
  };

  // Build a contextual initial message for Ed
  function buildInitialMessage(
    taskName: string,
    taskDomain: string,
    taskStatus?: string
  ): string {
    const domainNames: Record<string, string> = {
      legionella: 'Legionella Control',
      fire: 'Fire Safety',
      asbestos: 'Asbestos Management',
      electrical: 'Electrical Safety',
      gas: 'Gas Safety',
      water: 'Water Quality',
      mechanical: 'Mechanical & Heating',
      lifts: 'Lifts & LOLER',
      playground: 'Playground Safety',
      accessibility: 'Accessibility',
      security: 'Security',
      manual_handling: 'Manual Handling',
      working_at_height: 'Working at Height',
    };

    const domainName = domainNames[taskDomain] || taskDomain;

    let message = `I'm working on the "${taskName}" task in ${domainName}.`;

    if (taskStatus === 'overdue') {
      message += ' This task is overdue. What are the priority actions I should take?';
    } else if (taskStatus === 'completed') {
      message += ' I\'ve just completed this. What evidence should I retain?';
    } else {
      message += ' Can you guide me through the requirements?';
    }

    return message;
  }

  // Size classes for extra small button
  const sizeClasses = {
    default: 'h-9 px-4',
    sm: 'h-7 px-2',
    xs: 'h-6 px-1.5 text-xs',
  };

  return (
    <Button
      variant={variant}
      size={size === 'xs' ? 'sm' : size}
      onClick={handleClick}
      disabled={isOpening}
      className={`${size === 'xs' ? sizeClasses.xs : sizeClasses[size]} ${variant === 'ghost' ? 'hover:bg-purple-100 hover:text-purple-700' : ''}`}
      title={`Ask Ed about ${checkName}`}
    >
      <MessageCircle className={`w-4 h-4 ${!iconOnly && label !== 'Ask Ed' ? 'mr-1.5' : ''}`} />
      {!iconOnly && <span>{label}</span>}
    </Button>
  );
}

export default EdChatButton;
