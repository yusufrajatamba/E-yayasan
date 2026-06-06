# Security Specification: e-Gereja Enterprise Platform

## 1. Data Invariants

1. **Jemaat (Members)**: 
   - Must have a unique `id` conforming to standard regex validation.
   - `nama` and `tglUlangTahun` are mandatory and cannot be empty or extremely long.
   - All optional fields must be correctly typed (strings).

2. **Transaksi (Transactions)**:
   - `amount` must be a positive number greater than 0.
   - `category` must be one of the enum values: `'Ibadah Umum' | 'Ucapan Syukur' | 'Persepuluhan' | 'Sektor'`.
   - `date` and `keterangan` are required fields.

3. **Aset (Assets)**:
   - `jumlah` must be greater than or equal to 1.
   - `kondisi` must be either `'Baik' | 'Perlu Perbaikan' | 'Rusak'`.
   - `namaBarang` and `lokasi` are required and must exceed 2 characters but be less than 500 characters.

4. **Tagihan (Bills)**:
   - `jumlahTagihan` must be positive.
   - `status` must be either `'Lunas' | 'Belum Lunas'`.
   - `namaTagihan` and `untukSektor` are required.

5. **Jadwal Ibadah (Schedules)**:
   - `tanggalIbadah` and `waktuIbadah` must be valid formatted strings.
   - `namaIbadah`, `pemberitaFirman`, `petugasLiturgi`, and `pemimpinPujian` are all required and must be validated.

---

## 2. The "Dirty Dozen" Payloads

Here are 12 malicious payloads designed to test and breach data rules:

### A. Members Payloads (Identity & Types)
1. **Ghost Field Poisoning**: Bypassing key constraints by adding security claims directly inside the document.
   ```json
   { "id": "uuid-1", "nama": "John Doe", "tglUlangTahun": "1990-01-01", "isAdmin": true }
   ```
2. **Infinite Data Leak (Denial of Wallet)**: Injecting extremely large strings in strings fields of Members.
   ```json
   { "id": "uuid-2", "nama": "<1MB of repeating text...>", "tglUlangTahun": "2026-06-04" }
   ```
3. **Missing Critical Invariants**: Creating a member without `nama`.
   ```json
   { "id": "uuid-3", "tglUlangTahun": "1990-01-01" }
   ```

### B. Transactions Payloads (Financial Integrity)
4. **Negative Tithing Fraud**: Creating persepuluhan / general offerings with negative values.
   ```json
   { "id": "uuid-4", "category": "Persepuluhan", "amount": -5000000, "date": "2026-06-04", "keterangan": "Pencucian Uang" }
   ```
5. **Unauthorized Category Injection**: Forcing a malicious category not in the dropdown enums.
   ```json
   { "id": "uuid-5", "category": "Laundering", "amount": 250000, "date": "2026-06-04", "keterangan": "Test" }
   ```
6. **Zero Offerings Attack**: Adding zero-amount transactions to spam the records.
   ```json
   { "id": "uuid-6", "category": "Ibadah Umum", "amount": 0, "date": "2026-06-04", "keterangan": "Free Spam" }
   ```

### C. Assets Payloads (Inventory State Integrity)
7. **Invalid Conditions Hack**: Setting the asset condition to an unsupported word.
   ```json
   { "id": "uuid-7", "namaBarang": "Piano Baru", "jumlah": 1, "kondisi": "Ekselen", "lokasi": "Altar", "tanggalPerolehan": "2026-06-04" }
   ```
8. **Negative Quantity Poisoning**: Dropping asset count to negative amounts.
   ```json
   { "id": "uuid-8", "namaBarang": "Kursi", "jumlah": -10, "kondisi": "Baik", "lokasi": "Gudang", "tanggalPerolehan": "2026-06-04" }
   ```

### D. Bills & Tagihan Payloads (Dues & Status)
9. **Status State Hijacking**: Forcing status to an invalid state.
   ```json
   { "id": "uuid-9", "namaTagihan": "Iuran", "untukSektor": "Sektor I", "jumlahTagihan": 500000, "tanggalJatuhTempo": "2026-06-25", "status": "HutangLunas" }
   ```
10. **Extremely High Dues Exploit**: Triggering integer overflow / massive nominal checks.
    ```json
    { "id": "uuid-10", "namaTagihan": "Spam Bill", "untukSektor": "Semua", "jumlahTagihan": 999999999999999, "tanggalJatuhTempo": "2026-06-25", "status": "Belum Lunas" }
    ```

### E. Schedules Payloads (Temporal Integrity)
11. **Malicious Empty Fields**: Blank names for crucial scheduled ministries.
    ```json
    { "id": "uuid-11", "namaIbadah": "", "tanggalIbadah": "2026-06-07", "waktuIbadah": "", "pemberitaFirman": "", "petugasLiturgi": "", "pemimpinPujian": "" }
    ```
12. **Mismatched ID Pathing Exception**: Forcing a document with ID mismatch.
    ```json
    { "id": "uuid-wrong", "namaIbadah": "Ibadah Keluarga", "tanggalIbadah": "2026-06-07", "waktuIbadah": "19:00", "pemberitaFirman": "A", "petugasLiturgi": "B", "pemimpinPujian": "C" }
    ```

---

## 3. Test Runner Specification

The Firestore security rules in `firestore.rules` protect these constraints. Since this application represents a standalone multi-office management client (e-Gereja Administrative Station) where administrators access the records with the `gloria` passphrase, and all transactions and inventories are loaded by the admin terminal, database reads and writes are validated using schema-matching helpers `isValidMember()`, `isValidTransaction()`, `isValidAsset()`, `isValidBill()`, and `isValidSchedule()`.

All "Dirty Dozen" payloads will return `PERMISSION_DENIED` since they violate the strict shape verification keys, boundaries, sizes, strings lengths, and enum matches.
