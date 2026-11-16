import {auditPublicOutput} from '../src/catalog/integration.mjs';
import {draftAuditEntries} from '../src/catalog/validation-cycle.mjs';
console.log(JSON.stringify(auditPublicOutput(draftAuditEntries())));
