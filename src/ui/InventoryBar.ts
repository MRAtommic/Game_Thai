export interface InventoryItemMeta {
  name: string;
  description: string;
  badgeText?: string;
  active?: boolean;
}

export interface InventoryBarOptions {
  invBar: HTMLElement;
  modalBody: HTMLElement;
  items: string[];
  getMeta: (id: string) => InventoryItemMeta | undefined;
  getIconUrl: (id: string) => string;
  onUse: (id: string) => void;
  onReorder: (newOrder: string[]) => void;
  onOpenModal: (title: string, html: string) => void;
  onCloseModal: () => void;
  onPlayClick?: () => void;
}

export function getMaxVisibleInventorySlots(): number {
  const compact = window.innerWidth <= 900 || window.innerHeight <= 540;
  return compact ? 4 : 5;
}

export function renderSharedInventoryBar(opts: InventoryBarOptions): void {
  const { invBar, items, getMeta, getIconUrl, onUse, onPlayClick } = opts;
  invBar.innerHTML = '';

  if (items.length === 0) {
    invBar.innerHTML = '<span style="font-size:0.8rem;color:#8892a8;padding:6px 10px">กระเป๋าว่างเปล่า</span>';
    return;
  }

  const maxVisible = getMaxVisibleInventorySlots();
  const isOverflow = items.length > maxVisible;
  const visibleItems = isOverflow ? items.slice(0, maxVisible) : items;

  visibleItems.forEach((id, idx) => {
    const meta = getMeta(id);
    if (!meta) return;
    const btn = document.createElement('button');
    btn.className = 'inv-slot';
    if (meta.active) btn.classList.add('active');
    btn.title = `${meta.name}: ${meta.description}`;
    const url = getIconUrl(id);
    btn.innerHTML = `
      <span class="inv-num">${idx + 1}</span>
      <span class="inv-icon"><img class="inv-img" src="${url}" alt="${meta.name}" /></span>
      <span class="inv-name">${meta.badgeText ?? meta.name}</span>
    `;
    btn.addEventListener('click', () => onUse(id));
    invBar.appendChild(btn);
  });

  if (isOverflow) {
    const overflowCount = items.length - maxVisible;
    const moreBtn = document.createElement('button');
    moreBtn.className = 'inv-slot inv-more-btn';
    moreBtn.title = `จัดการกระเป๋า & ลากวางไอเทมขึ้นแถบโชว์ (${items.length} ชิ้น)`;
    moreBtn.innerHTML = `
      <span class="inv-more-badge">+${overflowCount}</span>
      <span class="inv-more-dots">•••</span>
      <span class="inv-name">จัดกระเป๋า</span>
    `;
    moreBtn.addEventListener('click', () => {
      onPlayClick?.();
      openInventoryOrganizerModal(opts);
    });
    invBar.appendChild(moreBtn);
  }
}

export function openInventoryOrganizerModal(opts: InventoryBarOptions): void {
  const maxVisible = getMaxVisibleInventorySlots();
  opts.onOpenModal(
    `จัดการกระเป๋า (${opts.items.length} ชิ้น) — ลากวางเลือกไอเทมโชว์`,
    `<div id="inv-organizer-root"></div>`
  );

  const renderOrganizerList = () => {
    const root = opts.modalBody.querySelector('#inv-organizer-root');
    if (!root) return;

    const rowsHtml = opts.items
      .map((id, idx) => {
        const meta = opts.getMeta(id);
        if (!meta) return '';
        const url = opts.getIconUrl(id);
        const inHotbar = idx < maxVisible;
        const divider =
          idx === maxVisible
            ? `<div class="inv-org-divider"><span>▼ อยู่ในช่องสำรอง (กดลากขึ้นด้านบนเพื่อนำไปโชว์บนแถบหลัก) ▼</span></div>`
            : '';
        return `${divider}
          <div class="inv-org-card ${inHotbar ? 'in-hotbar' : 'in-reserve'}" data-org-idx="${idx}">
            <div class="inv-org-grip" title="ลากเพื่อสลับตำแหน่ง">⋮⋮</div>
            <img class="inv-org-img" src="${url}" alt="${meta.name}" />
            <div class="inv-org-info">
              <div class="inv-org-title">
                <span class="inv-org-tag ${inHotbar ? 'hot' : ''}">${inHotbar ? `ช่องหลัก [${idx + 1}]` : 'กระเป๋าสำรอง'}</span>
                <strong>${meta.name}</strong>
              </div>
              <div class="inv-org-desc">${meta.description}</div>
            </div>
            <div class="inv-org-actions">
              ${!inHotbar ? `<button type="button" class="secondary-btn inv-org-action inv-pin-btn" data-pin="${idx}" title="นำขึ้นไปโชว์บนแถบหลัก">⬆ โชว์</button>` : ''}
              <button type="button" class="primary-btn inv-org-action inv-use-btn" data-use="${id}">ใช้</button>
            </div>
          </div>`;
      })
      .join('');

    root.innerHTML = `
      <p style="margin:0 0 10px;font-size:0.84rem;color:#d6d3d1">
        ลากการ์ดไอเทมขึ้น–ลงเพื่อจัดลำดับ <strong>${maxVisible} ชิ้นแรก</strong> จะถูกปักหมุดโชว์บนแถบลัดหน้าจอ (ทั้งเมาส์และนิ้วสัมผัส)
      </p>
      <div class="inv-org-list">${rowsHtml}</div>
    `;

    root.querySelectorAll<HTMLButtonElement>('[data-pin]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(btn.dataset.pin);
        if (Number.isNaN(idx) || idx < 0 || idx >= opts.items.length) return;
        const [moved] = opts.items.splice(idx, 1);
        const insertAt = Math.min(maxVisible - 1, opts.items.length);
        opts.items.splice(insertAt, 0, moved);
        opts.onPlayClick?.();
        opts.onReorder(opts.items);
        renderSharedInventoryBar(opts);
        renderOrganizerList();
      });
    });

    root.querySelectorAll<HTMLButtonElement>('[data-use]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemId = btn.dataset.use!;
        opts.onCloseModal();
        opts.onUse(itemId);
      });
    });

    // Pointer-based cross-device Drag & Drop (mouse + touch)
    root.querySelectorAll<HTMLElement>('.inv-org-card').forEach((card) => {
      card.addEventListener('pointerdown', (ev: PointerEvent) => {
        if ((ev.target as HTMLElement).closest('.inv-org-action')) return;
        if (ev.button !== 0 && ev.pointerType === 'mouse') return;

        const fromIdx = Number(card.dataset.orgIdx);
        if (Number.isNaN(fromIdx)) return;

        ev.preventDefault();
        const startX = ev.clientX;
        const startY = ev.clientY;
        const rect = card.getBoundingClientRect();
        let dragging = false;
        let ghost: HTMLElement | null = null;
        let targetIdx = fromIdx;

        const cleanupDrag = () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('pointercancel', onUp);
          ghost?.remove();
          ghost = null;
          card.classList.remove('inv-org-dragging');
          root.querySelectorAll('.inv-org-over').forEach((el) => el.classList.remove('inv-org-over'));
        };

        const onMove = (mv: PointerEvent) => {
          const dx = mv.clientX - startX;
          const dy = mv.clientY - startY;
          if (!dragging) {
            if (Math.hypot(dx, dy) < 6) return;
            dragging = true;
            card.classList.add('inv-org-dragging');
            ghost = card.cloneNode(true) as HTMLElement;
            ghost.classList.add('inv-drag-ghost');
            ghost.style.width = `${rect.width}px`;
            ghost.style.left = `${rect.left}px`;
            ghost.style.top = `${rect.top}px`;
            document.body.appendChild(ghost);
          }

          if (ghost) {
            ghost.style.left = `${rect.left + dx}px`;
            ghost.style.top = `${rect.top + dy}px`;
          }

          root.querySelectorAll('.inv-org-over').forEach((el) => el.classList.remove('inv-org-over'));
          const hit = document.elementFromPoint(mv.clientX, mv.clientY)?.closest<HTMLElement>('.inv-org-card');
          if (hit && root.contains(hit)) {
            const idx = Number(hit.dataset.orgIdx);
            if (!Number.isNaN(idx)) {
              targetIdx = idx;
              if (idx !== fromIdx) hit.classList.add('inv-org-over');
            }
          }
        };

        const onUp = () => {
          const didDrag = dragging;
          cleanupDrag();
          if (didDrag && targetIdx !== fromIdx && targetIdx >= 0 && targetIdx < opts.items.length) {
            const [moved] = opts.items.splice(fromIdx, 1);
            opts.items.splice(targetIdx, 0, moved);
            opts.onPlayClick?.();
            opts.onReorder(opts.items);
            renderSharedInventoryBar(opts);
            renderOrganizerList();
          }
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
      });
    });
  };

  renderOrganizerList();
}
