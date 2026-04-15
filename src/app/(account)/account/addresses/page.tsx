'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, MapPin, Star } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import type { Address } from '@/types/database'

export default function AddressesPage() {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  const fetchAddresses = async () => {
    if (!user) return

    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    setAddresses(data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchAddresses()
  }, [user])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    const { error } = await supabase.from('addresses').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete address')
    } else {
      toast.success('Address deleted')
      fetchAddresses()
    }
  }

  const handleSetDefault = async (id: string) => {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user!.id)

    await supabase.from('addresses').update({ is_default: true }).eq('id', id)

    toast.success('Default address updated')
    fetchAddresses()
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const addressData = {
      label: formData.get('label') as string,
      address_line_1: formData.get('address_line_1') as string,
      address_line_2: formData.get('address_line_2') as string || null,
      city: formData.get('city') as string,
      county: formData.get('county') as string || null,
      postcode: formData.get('postcode') as string,
      delivery_instructions: formData.get('delivery_instructions') as string || null,
    }

    if (editingAddress) {
      await supabase
        .from('addresses')
        .update(addressData)
        .eq('id', editingAddress.id)
    } else {
      await supabase.from('addresses').insert({
        ...addressData,
        user_id: user!.id,
        is_default: addresses.length === 0,
      })
    }

    toast.success(editingAddress ? 'Address updated' : 'Address added')
    setIsOpen(false)
    setEditingAddress(null)
    fetchAddresses()
  }

  const openEdit = (address: Address) => {
    setEditingAddress(address)
    setIsOpen(true)
  }

  const openNew = () => {
    setEditingAddress(null)
    setIsOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Addresses</h1>
          <p className="text-(--color-text-muted) mt-1">Manage your delivery addresses</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  name="label"
                  placeholder="Home, Work, etc."
                  defaultValue={editingAddress?.label || 'Home'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_line_1">Address Line 1</Label>
                <Input
                  id="address_line_1"
                  name="address_line_1"
                  placeholder="123 High Street"
                  defaultValue={editingAddress?.address_line_1 || ''}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_line_2">Address Line 2 (Optional)</Label>
                <Input
                  id="address_line_2"
                  name="address_line_2"
                  placeholder="Flat 4"
                  defaultValue={editingAddress?.address_line_2 || ''}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="London"
                    defaultValue={editingAddress?.city || ''}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="county">County (Optional)</Label>
                  <Input
                    id="county"
                    name="county"
                    placeholder="Greater London"
                    defaultValue={editingAddress?.county || ''}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  name="postcode"
                  placeholder="SW1A 1AA"
                  defaultValue={editingAddress?.postcode || ''}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_instructions">Delivery Instructions (Optional)</Label>
                <Input
                  id="delivery_instructions"
                  name="delivery_instructions"
                  placeholder="Ring doorbell, leave with neighbour, etc."
                  defaultValue={editingAddress?.delivery_instructions || ''}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Address</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-(--color-text-muted)">Loading addresses...</p>
        </div>
      ) : addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-(--color-text-disabled) mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{address.label}</p>
                        {address.is_default && (
                          <Badge variant="success" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <p className="text-(--color-text-secondary) mt-1">
                        {address.address_line_1}
                        {address.address_line_2 && <>, {address.address_line_2}</>}
                      </p>
                      <p className="text-(--color-text-secondary)">
                        {address.city}
                        {address.county && <>, {address.county}</>}
                      </p>
                      <p className="text-(--color-text-secondary)">{address.postcode}</p>
                      {address.delivery_instructions && (
                        <p className="text-sm text-(--color-text-muted) mt-2">
                          Note: {address.delivery_instructions}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!address.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSetDefault(address.id)}
                        title="Set as default"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(address)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(address.id)}
                      className="text-(--color-error) hover:text-(--color-error)"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-16 w-16 text-(--color-text-disabled) mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No addresses yet</h2>
            <p className="text-(--color-text-muted) mb-6">
              Add a delivery address to make checkout faster.
            </p>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
