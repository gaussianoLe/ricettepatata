import {integrationInputs,auditPublicOutput} from '../src/catalog/integration.mjs';
console.log(JSON.stringify(auditPublicOutput(integrationInputs().entries)));
