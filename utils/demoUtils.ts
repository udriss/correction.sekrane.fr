export function parseContentItems(fragments: { id: number, content: string }[]) {
  return fragments.map(fragment => ({
    type: 'paragraph',
    content: fragment.content
  }));
}

export function generateHtmlFromItems(items: { type: string, content: string }[]) {
  return items.map(item => {
    switch (item.type) {
      case 'paragraph':
        return `<p>${item.content}</p>`;
      default:
        return '';
    }
  }).join('');
}
