import type { Release } from '@/types'

const qty = (min = 1, max = 5) => Math.floor(Math.random() * (max - min + 1)) + min;
const now = new Date().toISOString();

function mockRelease(overrides: Partial<Release> & { id: string; title: string; artists: string[]; price: number }): Release {
  return {
    discogs_listing_id: 0,
    discogs_release_id: 0,
    labels: [],
    catno: '',
    genres: [],
    styles: [],
    format: 'Vinyl, 12"',
    year: null,
    country: 'ES',
    condition: 'NM',
    sleeve_condition: 'NM',
    currency: 'EUR',
    cover_image: `https://picsum.photos/seed/${overrides.id}/600/600`,
    thumb: `https://picsum.photos/seed/${overrides.id}/150/150`,
    status: 'active',
    quantity: qty(),
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

export const MOCK_RELEASES: Release[] = [
  mockRelease({ id: 'mock-9001', discogs_listing_id: 9001, discogs_release_id: 5001, title: 'Kind of Blue', artists: ['Miles Davis'], labels: ['Columbia'], catno: 'CL 1355', genres: ['Jazz'], styles: ['Modal'], format: 'Vinyl, LP', year: 1959, country: 'US', condition: 'M', sleeve_condition: 'M', price: 350.00, quantity: 1, comments: 'Original 6-eye pressing.' }),
  mockRelease({ id: 'mock-9002', discogs_listing_id: 9002, discogs_release_id: 5002, title: 'Windowlicker', artists: ['Aphex Twin'], labels: ['Warp Records'], catno: 'WAP105', genres: ['Electronic'], styles: ['IDM'], format: 'Vinyl, 12"', year: 1999, country: 'UK', condition: 'NM', sleeve_condition: 'NM', price: 120.00, comments: 'First press.' }),
  mockRelease({ id: 'mock-9003', discogs_listing_id: 9003, discogs_release_id: 5003, title: 'Strings of Life', artists: ['Rhythim Is Rhythim'], labels: ['Transmat'], catno: 'TM-002', genres: ['Electronic'], styles: ['Detroit Techno'], format: 'Vinyl, 12"', year: 1987, country: 'US', condition: 'VG+', sleeve_condition: 'VG', price: 95.00 }),
  mockRelease({ id: 'mock-9004', discogs_listing_id: 9004, discogs_release_id: 5004, title: 'No UFOs', artists: ['Model 500'], labels: ['Metroplex'], catno: 'M-001', genres: ['Electronic'], styles: ['Detroit Techno'], format: 'Vinyl, 12"', year: 1985, country: 'US', condition: 'VG', sleeve_condition: 'G+', price: 85.00 }),
  mockRelease({ id: 'mock-9005', discogs_listing_id: 9005, discogs_release_id: 5005, title: 'Spastik', artists: ['Plastikman'], labels: ['Plus 8'], catno: 'PLUS 8023', genres: ['Electronic'], styles: ['Minimal'], format: 'Vinyl, 12"', year: 1993, country: 'Canada', condition: 'NM', sleeve_condition: 'NM', price: 75.00, quantity: qty(3, 10) }),
  mockRelease({ id: 'mock-9006', discogs_listing_id: 9006, discogs_release_id: 5006, title: 'Energy Flash', artists: ['Joey Beltram'], labels: ['R&S Records'], catno: 'R&S 9204', genres: ['Electronic'], styles: ['Techno'], format: 'Vinyl, 12"', year: 1990, country: 'Belgium', condition: 'VG+', sleeve_condition: 'VG+', price: 65.00 }),
  mockRelease({ id: 'mock-9007', discogs_listing_id: 9007, discogs_release_id: 5007, title: 'Move Your Body', artists: ['Marshall Jefferson'], labels: ['Trax'], catno: 'TX102', genres: ['Electronic'], styles: ['House'], format: 'Vinyl, 12"', year: 1986, country: 'US', condition: 'VG+', sleeve_condition: 'VG+', price: 45.00 }),
  mockRelease({ id: 'mock-9008', discogs_listing_id: 9008, discogs_release_id: 5008, title: 'Pacific State', artists: ['808 State'], labels: ['ZTT'], catno: 'ZT44', genres: ['Electronic'], styles: ['Acid House'], format: 'Vinyl, 12"', year: 1989, country: 'UK', condition: 'NM', sleeve_condition: 'NM', price: 40.00, quantity: qty(2, 8) }),
  mockRelease({ id: 'mock-9009', discogs_listing_id: 9009, discogs_release_id: 5009, title: 'Voodoo Ray', artists: ['A Guy Called Gerald'], labels: ['Rham!'], catno: 'RAJ1', genres: ['Electronic'], styles: ['Acid House'], format: 'Vinyl, 12"', year: 1988, country: 'UK', condition: 'VG+', sleeve_condition: 'VG', price: 38.00, quantity: 1 }),
  mockRelease({ id: 'mock-9010', discogs_listing_id: 9010, discogs_release_id: 5010, title: 'Da Funk', artists: ['Daft Punk'], labels: ['Virgin'], catno: 'VS1625', genres: ['Electronic'], styles: ['House'], format: 'Vinyl, 12"', year: 1995, country: 'FR', condition: 'NM', sleeve_condition: 'NM', price: 42.00 }),
]
