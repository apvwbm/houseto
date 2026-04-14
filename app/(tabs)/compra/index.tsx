import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
} from 'react-native';
import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Check, Trash2, X, GripVertical, Pencil, ArrowDownAZ, Search, ListOrdered } from 'lucide-react-native';
import DragList, { DragListRenderItemInfo } from 'react-native-draglist';
import { supabase } from '@/lib/supabase';
import { ItemCompra } from '@/lib/types';
import { colors, fontSize, spacing, radius } from '@/lib/theme';
import { Button } from '@/components/ui/Button';

interface ItemFormData {
  nombre: string;
  cantidad: string;
}

const emptyForm: ItemFormData = {
  nombre: '',
  cantidad: '',
};

/* ─────────────────────────────────────
   Helper: normalizar orden de un array
   ───────────────────────────────────── */
function normalizeOrden(arr: ItemCompra[]): ItemCompra[] {
  return arr.map((item, idx) => ({ ...item, orden: idx }));
}

/* ─────────────────────────────────────
   Helper: ordenar items (sin marcar arriba por orden, marcados abajo por orden)
   ───────────────────────────────────── */
function sortItems(arr: ItemCompra[]): ItemCompra[] {
  const unchecked = arr.filter((i) => !i.comprado).sort((a, b) => a.orden - b.orden);
  const checked = arr.filter((i) => i.comprado).sort((a, b) => a.orden - b.orden);
  return [...unchecked, ...checked];
}

/* Separator data item used in the flat list */
const SEPARATOR_ID = '__separator__';

type ListItem =
  | (ItemCompra & { type: 'item' })
  | { type: 'separator'; id: string };

const noop = () => {};

/* ─────────────────────────────────────
   Persistir orden a DB (fire-and-forget, no bloquea UI)
   ───────────────────────────────────── */
function persistOrdenToDB(items: ItemCompra[]) {
  const now = new Date().toISOString();
  Promise.all(
    items.map((i) =>
      supabase
        .from('lista_compra')
        .update({ comprado: i.comprado, orden: i.orden, updated_at: now })
        .eq('id', i.id)
    )
  );
}

/* ─────────────────────────────────────
   Memoized Item Row (evita re-renders innecesarios)
   ───────────────────────────────────── */
interface CompraItemProps {
  item: ItemCompra & { type: 'item' };
  isActive: boolean;
  dragEnabled: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onToggle: (id: string, comprado: boolean) => void;
  onEdit: (item: ItemCompra) => void;
  onDelete: (id: string, nombre: string) => void;
}

const CompraItem = memo(function CompraItem({
  item,
  isActive,
  dragEnabled,
  onDragStart,
  onDragEnd,
  onToggle,
  onEdit,
  onDelete,
}: CompraItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.itemRow,
        item.comprado && styles.itemRowComprado,
        isActive && styles.itemRowActive,
      ]}
    >
      {/* Drag handle */}
      {dragEnabled && (
        <TouchableOpacity
          onPressIn={onDragStart}
          onPressOut={onDragEnd}
          style={styles.dragHandle}
          activeOpacity={0.7}
        >
          <GripVertical size={18} color={colors.textMuted} strokeWidth={2} />
        </TouchableOpacity>
      )}

      {/* Checkbox + text */}
      <TouchableOpacity
        style={[styles.itemContent, !dragEnabled && { paddingLeft: spacing.md }]}
        onPress={() => onToggle(item.id, item.comprado)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, item.comprado && styles.checkboxChecked]}>
          {item.comprado && <Check size={14} color="#fff" strokeWidth={3} />}
        </View>
        <View style={styles.itemTextWrap}>
          <Text style={[styles.itemNombre, item.comprado && styles.itemNombreComprado]}>
            {item.nombre}
          </Text>
          {item.cantidad ? (
            <Text style={styles.itemCantidad}>{item.cantidad}</Text>
          ) : null}
        </View>
      </TouchableOpacity>

      {/* Edit */}
      <TouchableOpacity
        onPress={() => onEdit(item)}
        style={styles.actionBtn}
        activeOpacity={0.7}
      >
        <Pencil size={15} color={colors.textSecondary} strokeWidth={2} />
      </TouchableOpacity>

      {/* Delete */}
      <TouchableOpacity
        onPress={() => onDelete(item.id, item.nombre)}
        style={styles.actionBtn}
        activeOpacity={0.7}
      >
        <Trash2 size={16} color={colors.error} strokeWidth={2} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

/* ─────────────────────────────────────
   Separator Row (estático, sin re-renders)
   ───────────────────────────────────── */
const SeparatorRow = memo(function SeparatorRow() {
  return (
    <View style={styles.separator}>
      <View style={styles.separatorLine} />
      <Text style={styles.separatorText}>Comprado</Text>
      <View style={styles.separatorLine} />
    </View>
  );
});

/* ═════════════════════════════════════
   PANTALLA PRINCIPAL
   ═════════════════════════════════════ */
export default function CompraScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ItemCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemCompra | null>(null);
  const [form, setForm] = useState<ItemFormData>(emptyForm);
  const [error, setError] = useState('');
  const [ordenAlfabetico, setOrdenAlfabetico] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Ref to always have fresh items in callbacks
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Guard: evita que el canal Realtime machaque el estado optimista
  const skipNextRealtimeRef = useRef(false);

  const fetchItems = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const { data, error: err } = await supabase
      .from('lista_compra')
      .select('*')
      .order('orden', { ascending: true });

    if (!err && data) {
      setItems(sortItems(data));
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const channel = supabase
      .channel('compra_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lista_compra' }, () => {
        if (skipNextRealtimeRef.current) {
          skipNextRealtimeRef.current = false;
          return;
        }
        fetchItems(true);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchItems]);

  /* ── Filtrado por búsqueda ── */
  const itemsFiltrados = useMemo(() => {
    if (!busqueda.trim()) return items;
    const q = busqueda.toLowerCase().trim();
    return items.filter(
      (i) =>
        i.nombre.toLowerCase().includes(q) ||
        (i.cantidad && i.cantidad.toLowerCase().includes(q))
    );
  }, [items, busqueda]);

  /* ── Sorted view: sin marcar arriba, marcados abajo ── */
  const uncheckedItems = useMemo(() => {
    const arr = itemsFiltrados.filter((i) => !i.comprado);
    if (ordenAlfabetico) return [...arr].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return arr;
  }, [itemsFiltrados, ordenAlfabetico]);

  const checkedItems = useMemo(() => {
    const arr = itemsFiltrados.filter((i) => i.comprado);
    if (ordenAlfabetico) return [...arr].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return arr;
  }, [itemsFiltrados, ordenAlfabetico]);

  /* ── Build flat list data with separator ── */
  const listData: ListItem[] = useMemo(() => {
    const data: ListItem[] = [];

    for (const item of uncheckedItems) {
      data.push({ ...item, type: 'item' });
    }

    if (checkedItems.length > 0) {
      data.push({ type: 'separator', id: SEPARATOR_ID });
      for (const item of checkedItems) {
        data.push({ ...item, type: 'item' });
      }
    }

    return data;
  }, [uncheckedItems, checkedItems]);

  /* ── Form ── */
  function openForm() {
    setEditingItem(null);
    setForm(emptyForm);
    setShowForm(true);
    setError('');
  }

  function openEditForm(item: ItemCompra) {
    setEditingItem(item);
    setForm({ nombre: item.nombre, cantidad: item.cantidad || '' });
    setShowForm(true);
    setError('');
  }

  async function handleSubmit() {
    setError('');
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    skipNextRealtimeRef.current = true;

    if (editingItem) {
      const { error: err } = await supabase
        .from('lista_compra')
        .update({
          nombre: form.nombre.trim(),
          cantidad: form.cantidad.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingItem.id);

      if (err) {
        setError('Error al guardar');
        skipNextRealtimeRef.current = false;
        return;
      }

      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? { ...i, nombre: form.nombre.trim(), cantidad: form.cantidad.trim() }
            : i
        )
      );
    } else {
      // New item: orden = max orden among unchecked + 1 (goes last in unchecked group)
      const unchecked = itemsRef.current.filter((i) => !i.comprado);
      const maxOrden = unchecked.length > 0 ? Math.max(...unchecked.map((i) => i.orden)) : -1;
      const newOrden = maxOrden + 1;

      // Shift all checked items orden up by 1 to make room
      const checked = itemsRef.current.filter((i) => i.comprado);
      const updates: PromiseLike<unknown>[] = [];

      if (checked.length > 0) {
        const shiftedChecked = checked.map((i) => ({ ...i, orden: i.orden + 1 }));
        for (const c of shiftedChecked) {
          updates.push(
            supabase.from('lista_compra').update({ orden: c.orden }).eq('id', c.id)
          );
        }
      }

      updates.push(
        supabase.from('lista_compra').insert({
          nombre: form.nombre.trim(),
          cantidad: form.cantidad.trim(),
          comprado: false,
          orden: newOrden,
        })
      );

      await Promise.all(updates);
    }

    setForm(emptyForm);
    setEditingItem(null);
    setShowForm(false);
    fetchItems(true);
  }

  /* ── Toggle comprado (optimista, fire-and-forget DB) ── */
  function toggleComprado(id: string, comprado: boolean) {
    const current = itemsRef.current;
    const item = current.find((i) => i.id === id);
    if (!item) return;

    const nowChecked = !comprado;
    let newItems: ItemCompra[];

    if (nowChecked) {
      const unchecked = current.filter((i) => !i.comprado && i.id !== id);
      const checked = current.filter((i) => i.comprado);
      const maxCheckedOrden = checked.length > 0 ? Math.max(...checked.map((i) => i.orden)) : -1;
      const movedItem = { ...item, comprado: true, orden: maxCheckedOrden + 1 };
      newItems = [...normalizeOrden(unchecked), ...normalizeOrden([...checked, movedItem])];
    } else {
      const unchecked = current.filter((i) => !i.comprado);
      const checked = current.filter((i) => i.comprado && i.id !== id);
      const maxUncheckedOrden = unchecked.length > 0 ? Math.max(...unchecked.map((i) => i.orden)) : -1;
      const movedItem = { ...item, comprado: false, orden: maxUncheckedOrden + 1 };
      newItems = [...normalizeOrden([...unchecked, movedItem]), ...normalizeOrden(checked)];
    }

    // Fix global orden: unchecked 0..N, checked N+1..M
    const finalUnchecked = newItems.filter((i) => !i.comprado);
    const finalChecked = newItems.filter((i) => i.comprado);
    const reordered = [
      ...finalUnchecked.map((i, idx) => ({ ...i, orden: idx })),
      ...finalChecked.map((i, idx) => ({ ...i, orden: finalUnchecked.length + idx })),
    ];

    // Actualizar UI inmediatamente
    setItems(reordered);

    // Persistir sin bloquear
    skipNextRealtimeRef.current = true;
    persistOrdenToDB(reordered);
  }

  /* ── Delete with confirmation ── */
  function confirmDelete(id: string, nombre: string) {
    Alert.alert(
      'Borrar item',
      `¿Borrar "${nombre}" de la lista?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () => deleteItem(id),
        },
      ]
    );
  }

  async function deleteItem(id: string) {
    const prev = itemsRef.current;
    const remaining = prev.filter((i) => i.id !== id);

    // Renormalize orden
    const unchecked = normalizeOrden(remaining.filter((i) => !i.comprado));
    const checked = remaining.filter((i) => i.comprado).map((i, idx) => ({
      ...i,
      orden: unchecked.length + idx,
    }));
    const reordered = [...unchecked, ...checked];

    setItems(reordered);

    skipNextRealtimeRef.current = true;

    // Delete from DB
    const { error: err } = await supabase.from('lista_compra').delete().eq('id', id);
    if (err) {
      setItems(prev);
      skipNextRealtimeRef.current = false;
      return;
    }

    // Persistir nuevo orden
    persistOrdenToDB(reordered);
  }

  // Refs estables para callbacks dentro de renderItem
  const toggleCompradoRef = useRef(toggleComprado);
  const openEditFormRef = useRef(openEditForm);
  const confirmDeleteRef = useRef(confirmDelete);
  toggleCompradoRef.current = toggleComprado;
  openEditFormRef.current = openEditForm;
  confirmDeleteRef.current = confirmDelete;

  // Callbacks estables que usan refs (nunca cambian de referencia)
  const stableToggle = useCallback((id: string, comprado: boolean) => {
    toggleCompradoRef.current(id, comprado);
  }, []);
  const stableEdit = useCallback((item: ItemCompra) => {
    openEditFormRef.current(item);
  }, []);
  const stableDelete = useCallback((id: string, nombre: string) => {
    confirmDeleteRef.current(id, nombre);
  }, []);

  /* ── Dragging allowed only when not filtering/sorting alphabetically ── */
  const dragEnabled = !ordenAlfabetico && !busqueda.trim();

  /* ── Handle reorder from DragList (síncrono, fire-and-forget DB) ── */
  const listDataRef = useRef(listData);
  listDataRef.current = listData;

  const onReordered = useCallback(async (fromIndex: number, toIndex: number) => {
    const current = [...listDataRef.current];
    const [removed] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, removed);

    // Rebuild items from reordered list (skip separator)
    const newUnchecked: ItemCompra[] = [];
    const newChecked: ItemCompra[] = [];

    for (const entry of current) {
      if (entry.type === 'separator') continue;
      if (entry.comprado) {
        newChecked.push(entry);
      } else {
        newUnchecked.push(entry);
      }
    }

    const reordered: ItemCompra[] = [
      ...newUnchecked.map((item, idx) => ({ ...item, orden: idx })),
      ...newChecked.map((item, idx) => ({ ...item, orden: newUnchecked.length + idx })),
    ];

    // Actualizar UI inmediatamente
    setItems(reordered);

    // Persistir sin bloquear
    skipNextRealtimeRef.current = true;
    persistOrdenToDB(reordered);
  }, []);

  /* ── Bulk actions ── */
  function markAllComprado() {
    Alert.alert(
      'Marcar todo como comprado',
      '¿Marcar todos los items como comprados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Marcar',
          onPress: () => {
            const all = itemsRef.current.map((i, idx) => ({
              ...i,
              comprado: true,
              orden: idx,
            }));
            setItems(all);
            skipNextRealtimeRef.current = true;
            persistOrdenToDB(all);
          },
        },
      ]
    );
  }

  function unmarkAll() {
    Alert.alert(
      'Desmarcar todo',
      '¿Desmarcar todos los items?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desmarcar',
          onPress: () => {
            const all = itemsRef.current.map((i, idx) => ({
              ...i,
              comprado: false,
              orden: idx,
            }));
            setItems(all);
            skipNextRealtimeRef.current = true;
            persistOrdenToDB(all);
          },
        },
      ]
    );
  }

  /* ── Render item para DragList ── */
  const renderDragItem = useCallback(
    (info: DragListRenderItemInfo<ListItem>) => {
      const { item, onDragStart, onDragEnd, isActive } = info;

      if (item.type === 'separator') {
        return <SeparatorRow />;
      }

      return (
        <CompraItem
          item={item}
          isActive={isActive}
          dragEnabled
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onToggle={stableToggle}
          onEdit={stableEdit}
          onDelete={stableDelete}
        />
      );
    },
    [stableToggle, stableEdit, stableDelete]
  );

  /* ── Render item para FlatList (sin drag, más ligero) ── */
  const renderFlatItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'separator') {
        return <SeparatorRow />;
      }

      return (
        <CompraItem
          item={item}
          isActive={false}
          dragEnabled={false}
          onDragStart={noop}
          onDragEnd={noop}
          onToggle={stableToggle}
          onEdit={stableEdit}
          onDelete={stableDelete}
        />
      );
    },
    [stableToggle, stableEdit, stableDelete]
  );

  const keyExtractor = useCallback((item: ListItem) => item.id, []);

  // Tab bar height to account for in overlays
  const tabBarHeight = 64 + insets.bottom;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Compra</Text>
        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={[styles.sortBtn, ordenAlfabetico && styles.sortBtnActive]}
            onPress={() => setOrdenAlfabetico((v) => !v)}
            activeOpacity={0.8}
          >
            {ordenAlfabetico ? (
              <ListOrdered size={18} color={colors.primary} strokeWidth={2.5} />
            ) : (
              <ArrowDownAZ size={18} color={colors.textSecondary} strokeWidth={2} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={openForm} activeOpacity={0.8}>
            <Plus size={22} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <Search size={16} color={colors.textMuted} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar producto..."
          placeholderTextColor={colors.textMuted}
        />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda('')} activeOpacity={0.7}>
            <X size={16} color={colors.textMuted} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Sin items en la compra</Text>
          <TouchableOpacity onPress={openForm} activeOpacity={0.8}>
            <Text style={styles.emptyLink}>+ Añadir item</Text>
          </TouchableOpacity>
        </View>
      ) : itemsFiltrados.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Sin resultados para "{busqueda}"</Text>
        </View>
      ) : dragEnabled ? (
        <DragList
          data={listData}
          renderItem={renderDragItem}
          keyExtractor={keyExtractor}
          onReordered={onReordered}
          containerStyle={styles.list}
          contentContainerStyle={[styles.listContent, { paddingBottom: 130 + tabBarHeight }]}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={listData}
          renderItem={renderFlatItem}
          keyExtractor={keyExtractor}
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingBottom: 130 + tabBarHeight }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {showForm && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.formOverlay, { bottom: tabBarHeight }]}
        >
          <TouchableOpacity
            style={styles.formOverlayBg}
            activeOpacity={1}
            onPress={() => { setShowForm(false); setError(''); setEditingItem(null); }}
          />
          <View style={styles.formSheet}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {editingItem ? 'Editar item' : 'Nuevo item'}
              </Text>
              <TouchableOpacity
                onPress={() => { setShowForm(false); setError(''); setEditingItem(null); }}
                activeOpacity={0.7}
              >
                <X size={20} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Producto *</Text>
                <TextInput
                  style={styles.input}
                  value={form.nombre}
                  onChangeText={(v) => setForm((f) => ({ ...f, nombre: v }))}
                  placeholder="Nombre del producto"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Cantidad (opcional)</Text>
                <TextInput
                  style={styles.input}
                  value={form.cantidad}
                  onChangeText={(v) => setForm((f) => ({ ...f, cantidad: v }))}
                  placeholder="Ej: 2kg, 1L"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            <View style={styles.formActions}>
              <Button
                title="Cancelar"
                onPress={() => { setShowForm(false); setError(''); setEditingItem(null); }}
                variant="ghost"
                style={{ flex: 1 }}
              />
              <Button
                title={editingItem ? 'Guardar' : 'Añadir'}
                onPress={handleSubmit}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {items.length > 0 && (
        <View style={styles.globalActions}>
          <Button
            title="Marcar todo comprado"
            onPress={markAllComprado}
            variant="secondary"
            size="sm"
            style={{ flex: 1 }}
          />
          <Button
            title="Desmarcar todo"
            onPress={unmarkAll}
            variant="ghost"
            size="sm"
            style={{ flex: 1 }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────
   Styles
   ───────────────────────────────────── */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sortBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  title: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: fontSize.xxl,
    color: colors.text,
  },
  addBtn: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Nunito-Regular',
    fontSize: fontSize.sm,
    color: colors.text,
    paddingVertical: 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    gap: 2,
  },
  itemRowComprado: {
    opacity: 0.55,
  },
  itemRowActive: {
    backgroundColor: colors.primaryLight,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    transform: [{ scale: 1.02 }],
  },
  dragHandle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemTextWrap: {
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  itemNombre: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: fontSize.md,
    color: colors.text,
  },
  itemNombreComprado: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  itemCantidad: {
    fontFamily: 'Nunito-Regular',
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionBtn: {
    padding: spacing.sm,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  separatorText: {
    fontFamily: 'Nunito-Bold',
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontFamily: 'Nunito-Regular',
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  emptyLink: {
    fontFamily: 'Nunito-Bold',
    fontSize: fontSize.md,
    color: colors.primary,
  },
  formOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
  },
  formOverlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  formSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  formTitle: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: fontSize.xl,
    color: colors.text,
  },
  formContent: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  formGroup: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: 'Nunito-Bold',
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: 'Nunito-Regular',
    fontSize: fontSize.md,
    color: colors.text,
  },
  errorText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: fontSize.sm,
    color: colors.error,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  globalActions: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
