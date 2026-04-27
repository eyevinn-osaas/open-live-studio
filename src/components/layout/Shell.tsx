import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { NavBar } from './NavBar'
import { useSourcesStore } from '@/store/sources.store'
import { useProductionsStore } from '@/store/productions.store'
import { useTemplatesStore } from '@/store/templates.store'
import { useGraphicsStore } from '@/store/graphics.store'
import { useOutputsStore } from '@/store/outputs.store'

export function Shell() {
  const fetchSources = useSourcesStore((s) => s.fetchAll)
  const fetchProductions = useProductionsStore((s) => s.fetchAll)
  const fetchTemplates = useTemplatesStore((s) => s.fetchAll)
  const fetchGraphics = useGraphicsStore((s) => s.fetchAll)
  const fetchOutputs = useOutputsStore((s) => s.fetchAll)

  useEffect(() => {
    void fetchTemplates()
  }, [fetchTemplates])

  useEffect(() => {
    void fetchGraphics()
  }, [fetchGraphics])

  useEffect(() => {
    void fetchOutputs()
  }, [fetchOutputs])

  useEffect(() => {
    void fetchSources()
    void fetchProductions()
    const id = setInterval(() => {
      void fetchSources()
      void fetchProductions()
    }, 5000)
    return () => clearInterval(id)
  }, [fetchSources, fetchProductions])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[--color-surface-1]">
      <NavBar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
