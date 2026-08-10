import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Filters from '../components/Filters';

// Mock ConvexProvider and ClerkProvider
vi.mock('convex/react', () => ({
  Authenticated: ({ children }: { children: React.ReactNode }) => children,
  Unauthenticated: () => null,
}));

vi.mock('@clerk/clerk-react', () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
}));

const MockProviders = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

describe('Filters Component', () => {
  const defaultProps = {
    selectedNeighborhood: '',
    setSelectedNeighborhood: vi.fn(),
    glutenFree: false,
    setGlutenFree: vi.fn(),
    allowMinors: false,
    setAllowMinors: vi.fn(),
    allowTakeout: false,
    setAllowTakeout: vi.fn(),
    allowDelivery: false,
    setAllowDelivery: vi.fn(),
    isOpenNow: false,
    setIsOpenNow: vi.fn(),
    selectedType: '',
    setSelectedType: vi.fn(),
    favoritesOnly: false,
    setFavoritesOnly: vi.fn(),
    openAtEnabled: false,
    setOpenAtEnabled: vi.fn(),
    openAtDate: '',
    setOpenAtDate: vi.fn(),
    openAtTime: '',
    setOpenAtTime: vi.fn(),
    neighborhoods: ['Downtown', 'Pearl District', 'Hawthorne'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all filter options', () => {
    render(
      <MockProviders>
        <Filters {...defaultProps} />
      </MockProviders>
    );

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Open Now')).toBeInTheDocument();
    expect(screen.getByText('Nick\'s unnecessarily complicated Open At filter')).toBeInTheDocument();
    expect(screen.getByText('Gluten Free Options')).toBeInTheDocument();
    expect(screen.getByText('Family Friendly')).toBeInTheDocument();
    expect(screen.getByText('Takeout Available')).toBeInTheDocument();
    expect(screen.getByText('Delivery Available')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Neighborhoods')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Types')).toBeInTheDocument();
  });

  it('calls setIsOpenNow when Open Now checkbox is clicked', () => {
    render(
      <MockProviders>
        <Filters {...defaultProps} />
      </MockProviders>
    );

    const openNowCheckbox = screen.getByLabelText(/Open Now/);
    fireEvent.click(openNowCheckbox);

    expect(defaultProps.setIsOpenNow).toHaveBeenCalledWith(true);
  });

  it('calls setOpenAtEnabled when Nick\'s filter checkbox is clicked', () => {
    render(
      <MockProviders>
        <Filters {...defaultProps} />
      </MockProviders>
    );

    const openAtCheckbox = screen.getByLabelText(/Nick's unnecessarily complicated Open At filter/);
    fireEvent.click(openAtCheckbox);

    expect(defaultProps.setOpenAtEnabled).toHaveBeenCalledWith(true);
  });

  it('shows date and time inputs when Nick\'s filter is enabled', () => {
    const propsWithOpenAt = { ...defaultProps, openAtEnabled: true };
    
    render(
      <MockProviders>
        <Filters {...propsWithOpenAt} />
      </MockProviders>
    );

    expect(screen.getByLabelText(/Date/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Time/)).toBeInTheDocument();
  });

  it('calls setGlutenFree when Gluten Free checkbox is clicked', () => {
    render(
      <MockProviders>
        <Filters {...defaultProps} />
      </MockProviders>
    );

    const glutenFreeCheckbox = screen.getByLabelText(/Gluten Free Options/);
    fireEvent.click(glutenFreeCheckbox);

    expect(defaultProps.setGlutenFree).toHaveBeenCalledWith(true);
  });

  it('calls setAllowMinors when Family Friendly checkbox is clicked', () => {
    render(
      <MockProviders>
        <Filters {...defaultProps} />
      </MockProviders>
    );

    const familyFriendlyCheckbox = screen.getByLabelText(/Family Friendly/);
    fireEvent.click(familyFriendlyCheckbox);

    expect(defaultProps.setAllowMinors).toHaveBeenCalledWith(true);
  });

  it('calls setAllowTakeout when Takeout checkbox is clicked', () => {
    render(
      <MockProviders>
        <Filters {...defaultProps} />
      </MockProviders>
    );

    const takeoutCheckbox = screen.getByLabelText(/Takeout Available/);
    fireEvent.click(takeoutCheckbox);

    expect(defaultProps.setAllowTakeout).toHaveBeenCalledWith(true);
  });

  it('calls setAllowDelivery when Delivery checkbox is clicked', () => {
    render(
      <MockProviders>
        <Filters {...defaultProps} />
      </MockProviders>
    );

    const deliveryCheckbox = screen.getByLabelText(/Delivery Available/);
    fireEvent.click(deliveryCheckbox);

    expect(defaultProps.setAllowDelivery).toHaveBeenCalledWith(true);
  });

  it('calls setSelectedNeighborhood when neighborhood is selected', () => {
    render(
      <MockProviders>
        <Filters {...defaultProps} />
      </MockProviders>
    );

    const neighborhoodSelect = screen.getByDisplayValue('All Neighborhoods');
    fireEvent.change(neighborhoodSelect, { target: { value: 'Downtown' } });

    expect(defaultProps.setSelectedNeighborhood).toHaveBeenCalledWith('Downtown');
  });

  it('calls setSelectedType when type is selected', () => {
    render(
      <MockProviders>
        <Filters {...defaultProps} />
      </MockProviders>
    );

    const typeSelect = screen.getByDisplayValue('All Types');
    fireEvent.change(typeSelect, { target: { value: 'meat' } });

    expect(defaultProps.setSelectedType).toHaveBeenCalledWith('meat');
  });

  it('shows Clear All button and clears all filters when clicked', () => {
    const props = {
      ...defaultProps,
      selectedNeighborhood: 'Downtown',
      glutenFree: true,
      allowMinors: true,
      isOpenNow: true,
      selectedType: 'meat',
    };

    render(
      <MockProviders>
        <Filters {...props} />
      </MockProviders>
    );

    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);

    expect(props.setSelectedNeighborhood).toHaveBeenCalledWith('');
    expect(props.setGlutenFree).toHaveBeenCalledWith(false);
    expect(props.setAllowMinors).toHaveBeenCalledWith(false);
    expect(props.setAllowTakeout).toHaveBeenCalledWith(false);
    expect(props.setAllowDelivery).toHaveBeenCalledWith(false);
    expect(props.setIsOpenNow).toHaveBeenCalledWith(false);
    expect(props.setSelectedType).toHaveBeenCalledWith('');
    expect(props.setFavoritesOnly).toHaveBeenCalledWith(false);
  });

  it('reflects current state in checkbox checked status', () => {
    const props = {
      ...defaultProps,
      glutenFree: true,
      allowMinors: true,
      isOpenNow: true,
    };

    render(
      <MockProviders>
        <Filters {...props} />
      </MockProviders>
    );

    expect(screen.getByLabelText(/Open Now/)).toBeChecked();
    expect(screen.getByLabelText(/Gluten Free Options/)).toBeChecked();
    expect(screen.getByLabelText(/Family Friendly/)).toBeChecked();
  });

  it('populates neighborhood options correctly', () => {
    render(
      <MockProviders>
        <Filters {...defaultProps} />
      </MockProviders>
    );
    
    // Check that all neighborhoods are present as options
    expect(screen.getByRole('option', { name: 'Downtown' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Pearl District' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Hawthorne' })).toBeInTheDocument();
  });
});