# Grove House SEND UAT Baseline

Captured: 2026-06-08T18:21:33.245Z

Organisation: Grove House Primary School
Organisation ID: `d9d1ac2c-5eff-4043-98f4-e1c43f616fd3`

This baseline stores counts and row checksums only. It intentionally does not store pupil names, dates of birth, UPNs, SEND notes, funding values, document contents or other raw pupil/customer data.

| Table | Available | Count | Checksum | Basis / note |
| --- | ---: | ---: | --- | --- |
| `pupils` | yes | 445 | `d5ef788dee2e9f07688fcebf7b9669d1a994f17f3eea3adbf8f41c0492e56bcc` | sha256(id/updated_at/created_at), no pupil/customer values stored |
| `send_register` | yes | 106 | `6d5b2af58ff2b374da7b3fbaa2b9ab8beb588fa45ce73d6c3a8cbde8d91f118d` | sha256(id/updated_at/created_at), no pupil/customer values stored |
| `sen_provisions` | no |  | not available | Table not exposed/present in current API schema cache |
| `send_provisions` | no |  | not available | Table not exposed/present in current API schema cache |
| `sen_apdr_cycles` | no |  | not available | Table not exposed/present in current API schema cache |
| `send_apdr_cycles` | no |  | not available | Table not exposed/present in current API schema cache |
| `sen_referrals` | no |  | not available | Table not exposed/present in current API schema cache |
| `send_referrals` | yes | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | sha256(id/updated_at/created_at), no pupil/customer values stored |
| `sen_evidence_files` | yes | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | sha256(id/updated_at/created_at), no pupil/customer values stored |
| `send_funding_allocations` | no |  | not available | Table not exposed/present in current API schema cache |
| `send_funding_reconciliation_runs` | no |  | not available | Table not exposed/present in current API schema cache |
| `send_status_import_datasets` | yes | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | sha256(id), no pupil/customer values stored |
| `ls_classes` | yes | 28 | `1f01e1152134b399407135acb90018c176b7605f7bcd7722697902c3d09c9800` | sha256(id/updated_at/created_at), no pupil/customer values stored |
| `staff_class_assignments` | yes | 66 | `fb3374ed35519a3adb1467025de6c018c093a007dff985236fde49ecbbff282c` | sha256(id/updated_at/created_at), no pupil/customer values stored |
| `staff` | no |  | not available | Table not exposed/present in current API schema cache |

## Cleanup Rule

After each SEND write test, rerun this baseline process or equivalent count/checksum checks. Test data must be removed or edited Grove House records restored before the next task starts.
