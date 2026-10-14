import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhoneDdiInput } from '../components/PhoneDdiInput';

describe('PhoneDdiInput Component', () => {
  it('renders with Brazil (+55) and flag preset by default', () => {
    render(<PhoneDdiInput value="" onChange={vi.fn()} />);

    const trigger = screen.getByTestId('dropdown-ddi-trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('🇧🇷');
    expect(trigger).toHaveTextContent('+55');

    const input = screen.getByTestId('input-register-whatsapp');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', '(11) 99999-9999');
  });

  it('opens dropdown on click, displays search input, and lists countries', () => {
    render(<PhoneDdiInput value="" onChange={vi.fn()} />);

    // Dropdown está fechado inicialmente
    expect(screen.queryByTestId('ddi-dropdown-menu')).not.toBeInTheDocument();

    // Clica no gatilho do DDI
    fireEvent.click(screen.getByTestId('dropdown-ddi-trigger'));

    // Dropdown abre
    expect(screen.getByTestId('ddi-dropdown-menu')).toBeInTheDocument();
    expect(screen.getByTestId('ddi-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('ddi-option-br')).toBeInTheDocument();
    expect(screen.getByTestId('ddi-option-pt')).toBeInTheDocument();
    expect(screen.getByTestId('ddi-option-us')).toBeInTheDocument();
  });

  it('filters countries when typing in search input', () => {
    render(<PhoneDdiInput value="" onChange={vi.fn()} />);

    fireEvent.click(screen.getByTestId('dropdown-ddi-trigger'));

    const searchInput = screen.getByTestId('ddi-search-input');
    fireEvent.change(searchInput, { target: { value: 'Portugal' } });

    expect(screen.getByTestId('ddi-option-pt')).toBeInTheDocument();
    expect(screen.queryByTestId('ddi-option-br')).not.toBeInTheDocument();
  });

  it('switches DDI and updates combined phone number when selecting another country', () => {
    const onChange = vi.fn();
    render(<PhoneDdiInput value="+55 (11) 98888-7777" onChange={onChange} />);

    // Abre dropdown
    fireEvent.click(screen.getByTestId('dropdown-ddi-trigger'));

    // Seleciona Portugal (+351)
    fireEvent.click(screen.getByTestId('ddi-option-pt'));

    // Dropdown deve fechar
    expect(screen.queryByTestId('ddi-dropdown-menu')).not.toBeInTheDocument();

    // Gatilho agora mostra Portugal
    const trigger = screen.getByTestId('dropdown-ddi-trigger');
    expect(trigger).toHaveTextContent('🇵🇹');
    expect(trigger).toHaveTextContent('+351');

    // onChange chamado com o novo DDI + número
    expect(onChange).toHaveBeenCalledWith('+351 (11) 98888-7777');
  });

  it('formats brazilian phone numbers properly with DDD and mask', () => {
    const onChange = vi.fn();
    render(<PhoneDdiInput value="" onChange={onChange} />);

    const input = screen.getByTestId('input-register-whatsapp');
    fireEvent.change(input, { target: { value: '85988146141' } });

    expect(onChange).toHaveBeenCalledWith('+55 (85) 98814-6141');
  });

  it('prevents duplicating DDI when user pastes number starting with 55', () => {
    const onChange = vi.fn();
    render(<PhoneDdiInput value="" onChange={onChange} />);

    const input = screen.getByTestId('input-register-whatsapp');
    fireEvent.change(input, { target: { value: '5585988146141' } });

    // Remove o 55 duplicado e formata o número local
    expect(onChange).toHaveBeenCalledWith('+55 (85) 98814-6141');
  });

  it('closes dropdown when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside-area">Fora</div>
        <PhoneDdiInput value="" onChange={vi.fn()} />
      </div>
    );

    fireEvent.click(screen.getByTestId('dropdown-ddi-trigger'));
    expect(screen.getByTestId('ddi-dropdown-menu')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside-area'));
    expect(screen.queryByTestId('ddi-dropdown-menu')).not.toBeInTheDocument();
  });
});
