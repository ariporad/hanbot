import { getState } from '../store';

export default function () {
	return `
\`\`\`json
${JSON.stringify(getState(), null, 4)}
\`\`\`
`;
}
