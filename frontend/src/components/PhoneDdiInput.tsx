import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

export interface CountryDdi {
  code: string;
  name: string;
  ddi: string;
  flag: string;
  placeholder: string;
}

export const COUNTRIES: CountryDdi[] = [
  { code: 'BR', name: 'Brasil', ddi: '+55', flag: '🇧🇷', placeholder: '(11) 99999-9999' },
  { code: 'US', name: 'Estados Unidos', ddi: '+1', flag: '🇺🇸', placeholder: '(555) 000-0000' },
  { code: 'PT', name: 'Portugal', ddi: '+351', flag: '🇵🇹', placeholder: '912 345 678' },
  { code: 'ES', name: 'Espanha', ddi: '+34', flag: '🇪🇸', placeholder: '612 345 678' },
  { code: 'AR', name: 'Argentina', ddi: '+54', flag: '🇦🇷', placeholder: '11 1234-5678' },
  { code: 'MX', name: 'México', ddi: '+52', flag: '🇲🇽', placeholder: '55 1234 5678' },
  { code: 'CL', name: 'Chile', ddi: '+56', flag: '🇨🇱', placeholder: '9 1234 5678' },
  { code: 'CO', name: 'Colômbia', ddi: '+57', flag: '🇨🇴', placeholder: '300 123 4567' },
  { code: 'UY', name: 'Uruguai', ddi: '+598', flag: '🇺🇾', placeholder: '99 123 456' },
  { code: 'PY', name: 'Paraguai', ddi: '+595', flag: '🇵🇾', placeholder: '981 123 456' },
  { code: 'PE', name: 'Peru', ddi: '+51', flag: '🇵🇪', placeholder: '912 345 678' },
  { code: 'BO', name: 'Bolívia', ddi: '+591', flag: '🇧🇴', placeholder: '71234567' },
  { code: 'VE', name: 'Venezuela', ddi: '+58', flag: '🇻🇪', placeholder: '412 1234567' },
  { code: 'GB', name: 'Reino Unido', ddi: '+44', flag: '🇬🇧', placeholder: '7911 123456' },
  { code: 'FR', name: 'França', ddi: '+33', flag: '🇫🇷', placeholder: '6 12 34 56 78' },
  { code: 'DE', name: 'Alemanha', ddi: '+49', flag: '🇩🇪', placeholder: '151 12345678' },
  { code: 'IT', name: 'Itália', ddi: '+39', flag: '🇮🇹', placeholder: '312 345 6789' },
  { code: 'CA', name: 'Canadá', ddi: '+1', flag: '🇨🇦', placeholder: '(555) 000-0000' },
  { code: 'AU', name: 'Austrália', ddi: '+61', flag: '🇦🇺', placeholder: '412 345 678' },
  { code: 'JP', name: 'Japão', ddi: '+81', flag: '🇯🇵', placeholder: '90 1234 5678' },
  { code: 'CN', name: 'China', ddi: '+86', flag: '🇨🇳', placeholder: '131 2345 6789' },
  { code: 'IN', name: 'Índia', ddi: '+91', flag: '🇮🇳', placeholder: '98123 45678' },
  { code: 'AO', name: 'Angola', ddi: '+244', flag: '🇦🇴', placeholder: '923 456 789' },
  { code: 'MZ', name: 'Moçambique', ddi: '+258', flag: '🇲🇿', placeholder: '84 123 4567' },
  { code: 'CV', name: 'Cabo Verde', ddi: '+238', flag: '🇨🇻', placeholder: '991 2345' },
  { code: 'GW', name: 'Guiné-Bissau', ddi: '+245', flag: '🇬🇼', placeholder: '955 123 456' },
  { code: 'ST', name: 'São Tomé e Príncipe', ddi: '+239', flag: '🇸🇹', placeholder: '991 2345' },
  { code: 'TL', name: 'Timor-Leste', ddi: '+670', flag: '🇹🇱', placeholder: '7712 3456' },
  { code: 'CH', name: 'Suíça', ddi: '+41', flag: '🇨🇭', placeholder: '78 123 45 67' },
  { code: 'IE', name: 'Irlanda', ddi: '+353', flag: '🇮🇪', placeholder: '85 123 4567' },
  { code: 'NL', name: 'Holanda', ddi: '+31', flag: '🇳🇱', placeholder: '6 12345678' },
  { code: 'BE', name: 'Bélgica', ddi: '+32', flag: '🇧🇪', placeholder: '470 12 34 56' },
  { code: 'AE', name: 'Emirados Árabes', ddi: '+971', flag: '🇦🇪', placeholder: '50 123 4567' },
];

export interface PhoneDdiInputProps {
  value: string;
  onChange: (fullNumber: string) => void;
  defaultDdi?: string;
  disabled?: boolean;
  inputTestId?: string;
  dropdownTestId?: string;
}

export const PhoneDdiInput: React.FC<PhoneDdiInputProps> = ({
  value,
  onChange,
  defaultDdi = '+55',
  disabled = false,
  inputTestId = 'input-register-whatsapp',
  dropdownTestId = 'dropdown-ddi-trigger',
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryDdi>(() => {
    return COUNTRIES.find((c) => c.ddi === defaultDdi) || COUNTRIES[0];
  });
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filtro de países por nome ou DDI
  const filteredCountries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.ddi.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  // Formatação amigável para Brasil (+55)
  const formatBrazilianPhone = (digits: string) => {
    const clean = digits.replace(/\D/g, '').slice(0, 11);
    if (clean.length <= 2) return clean;
    if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  };

  // Extrai o número local sem o DDI duplicado caso colado com código
  const extractLocalNumber = (raw: string, ddi: string) => {
    let clean = raw.trim();
    const ddiDigits = ddi.replace(/\D/g, '');
    if (clean.startsWith(ddi)) {
      clean = clean.slice(ddi.length).trim();
    } else if (clean.startsWith(ddiDigits) && clean.length > ddiDigits.length + 6) {
      clean = clean.slice(ddiDigits.length).trim();
    }
    return clean;
  };

  // Valor local exibido no campo
  const displayLocalValue = useMemo(() => {
    return extractLocalNumber(value, selectedCountry.ddi);
  }, [value, selectedCountry.ddi]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleanLocal = extractLocalNumber(raw, selectedCountry.ddi);

    let formatted = cleanLocal;
    if (selectedCountry.ddi === '+55') {
      formatted = formatBrazilianPhone(cleanLocal);
    }

    // Se o usuário digitou algo, compõe o número completo com DDI
    const combined = formatted.trim() ? `${selectedCountry.ddi} ${formatted}` : '';
    onChange(combined);
  };

  const handleSelectCountry = (country: CountryDdi) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchTerm('');

    // Recompõe o número com o novo DDI
    const currentLocal = extractLocalNumber(value, selectedCountry.ddi);
    const combined = currentLocal.trim() ? `${country.ddi} ${currentLocal}` : '';
    onChange(combined);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center rounded-xl bg-slate-950/80 border border-slate-800 focus-within:border-pink-500 transition-colors overflow-hidden">
        {/* Botão Gatilho do Dropdown de DDI */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          data-testid={dropdownTestId}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-xs text-white border-r border-slate-800 transition-colors shrink-0 cursor-pointer select-none"
          title={`País: ${selectedCountry.name} (${selectedCountry.ddi})`}
        >
          <span className="text-base leading-none" role="img" aria-label={selectedCountry.name}>
            {selectedCountry.flag}
          </span>
          <span className="font-semibold text-slate-200">{selectedCountry.ddi}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Input Numérico do Telefone */}
        <input
          type="tel"
          required
          autoComplete="off"
          disabled={disabled}
          value={displayLocalValue}
          onChange={handleInputChange}
          placeholder={selectedCountry.placeholder}
          data-testid={inputTestId}
          className="w-full px-3 py-2.5 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_#020617_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#fff]"
        />
      </div>

      {/* Menu Dropdown de Seleção de Países */}
      {isOpen && (
        <div
          data-testid="ddi-dropdown-menu"
          className="absolute left-0 top-full mt-1.5 w-72 max-w-[90vw] max-h-64 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl shadow-black/80 z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Campo de Busca Rápida */}
          <div className="p-2 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar país ou DDI..."
                data-testid="ddi-search-input"
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          {/* Lista de Países */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-800/40">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => {
                const isSelected = country.code === selectedCountry.code;
                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelectCountry(country)}
                    data-testid={`ddi-option-${country.code.toLowerCase()}`}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer hover:bg-pink-500/10 hover:text-pink-300 ${
                      isSelected ? 'bg-pink-500/15 text-pink-400 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-base leading-none shrink-0" role="img" aria-label={country.name}>
                        {country.flag}
                      </span>
                      <span className="truncate">{country.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-slate-400 font-mono text-[11px]">{country.ddi}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-pink-400 shrink-0" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">Nenhum país encontrado</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
