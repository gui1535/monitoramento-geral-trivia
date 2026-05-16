import { topology } from '../../data/topology'
import { NetworkLinks } from './NetworkLinks'
import { NetworkNode } from './NetworkNode'

export function TopologyMap({ data = topology }) {
  return (
    <>
      <NetworkLinks links={data.links} nodes={data.nodes} />
      {data.nodes.map((node) => (
        <NetworkNode key={node.id} node={node} />
      ))}
    </>
  )
}
